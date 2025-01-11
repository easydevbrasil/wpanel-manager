// Load environment variables from .env file
import dotenv from "dotenv";
import path from "path";

// Load from the wpanel .env file specifically  
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Don't force NODE_ENV - let it be set by the environment or package.json script
// process.env.NODE_ENV = "production";

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupSwagger } from "./swagger";
import MinioService from "./minio";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Trust proxy for accurate IP address detection
app.set("trust proxy", 1);

// Allow all hosts - bypass host validation
app.use((req, res, next) => {
  // Remove host validation - allow any host header
  next();
});

// Removed global API key authentication to allow web interface access
// app.use(authenticateApiKey);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && !path.includes("/api/system/stats")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize MinIO service
  try {
    console.log('Initializing MinIO service...');
    await MinioService.initialize();
    console.log('MinIO service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MinIO service:', error);
    // Don't stop the server, just log the error
  }

  // Setup Swagger documentation
  setupSwagger(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log('NODE_ENV:', process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    console.log('Starting Vite dev server...');
    await setupVite(app, server);
  } else {
    console.log('Serving static files from production build...');
    serveStatic(app);
  }

  // Setup periodic exchange rate updates
  const startExchangeRateUpdater = () => {
    // Update exchange rates every hour
    const updateInterval = 60 * 60 * 1000; // 1 hour in milliseconds

    const updateExchangeRates = async () => {
      try {
        log("Updating exchange rates...");
        await storage.updateExchangeRates();
        log("Exchange rates updated successfully");
      } catch (error) {
        log(`Error updating exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Update immediately on startup
    setTimeout(() => {
      updateExchangeRates();
    }, 5000); // Wait 5 seconds after server starts

    // Then update every hour
    setInterval(updateExchangeRates, updateInterval);
  };

  startExchangeRateUpdater();

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 8000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();