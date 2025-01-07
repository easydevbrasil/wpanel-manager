import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: true,
    allowedHosts: "all",
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...serverOptions,
      ...viteConfig.server,
      allowedHosts: true,
    },
    appType: "custom",
  });

  // Override host header before Vite middleware to bypass host validation
  app.use((req, res, next) => {
    // Allow all hosts by overriding the host header for Vite
    const originalUrl = req.url;
    const originalHost = req.headers.host;
    
    // If this is not an API route and the request has a different host,
    // temporarily change the host header to localhost for Vite
    if (!originalUrl?.startsWith('/api/') && originalHost && originalHost !== 'localhost:8000') {
      req.headers.host = 'localhost:8000';
    }
    
    next();
  });

  app.use(vite.middlewares);
  
  // Override the Vite middleware to bypass host validation
  app.use((req, res, next) => {
    // Allow all hosts by overriding the host header for Vite
    const originalUrl = req.url;
    const originalHost = req.headers.host;
    
    // If this is not an API route and the request is being blocked,
    // temporarily change the host header to localhost
    if (!originalUrl?.startsWith('/api/') && originalHost && originalHost !== 'localhost:8000') {
      req.headers.host = 'localhost:8000';
    }
    
    next();
  });
  
  // Only handle non-API routes with the catch-all
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
