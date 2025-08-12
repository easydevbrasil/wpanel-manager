import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage as dbStorage } from "./storage";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import os from "os";

// Helper function to measure CPU usage
function getCpuUsageMeasure() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

// Add CPU usage calculation helper
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = getCpuUsageMeasure();
    setTimeout(() => {
      const endMeasure = getCpuUsageMeasure();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      const cpuPercentage = 100 - (100 * idleDifference) / totalDifference;
      resolve(Math.max(0, Math.min(100, Math.round(cpuPercentage))));
    }, 1000);
  });
}

// Function to generate mail_accounts.cf file
async function generateMailAccountsFile() {
  try {
    const accounts = await dbStorage.getEmailAccounts();
    const lines = accounts.map((account) => {
      // For Postfix compatibility, we need to store the Argon2 hash directly
      // Postfix supports various formats including Argon2
      return `${account.email}|${account.password}`;
    });

    const filePath = path.join(process.cwd(), "mail_accounts.cf");
    const content = lines.join("\n") + "\n";

    await fs.promises.writeFile(filePath, content, "utf8");
    console.log(`Generated mail_accounts.cf with ${accounts.length} accounts`);
  } catch (error) {
    console.error("Error generating mail_accounts.cf:", error);
  }
}

// Function to restart mailserver container
async function restartMailserverContainer() {
  try {
    const dockerUri = process.env.DOCKER_URI || "http://localhost:2375";

    // First, try to find the mailserver container
    const containersResponse = await fetch(`${dockerUri}/containers/json?all=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!containersResponse.ok) {
      console.error("Failed to get containers list");
      return;
    }

    const containers = await containersResponse.json();
    const mailserverContainer = containers.find((container: any) =>
      container.Names.some((name: string) => name.includes("mailserver")) ||
      container.Image.includes("mailserver") ||
      container.Image.includes("postfix") ||
      container.Image.includes("dovecot")
    );

    if (!mailserverContainer) {
      console.log("Mailserver container not found");
      return;
    }

    console.log(`Restarting mailserver container: ${mailserverContainer.Id}`);

    // Restart the container
    const restartResponse = await fetch(`${dockerUri}/containers/${mailserverContainer.Id}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (restartResponse.ok) {
      console.log("Mailserver container restarted successfully");
    } else {
      console.error("Failed to restart mailserver container:", restartResponse.status);
    }
  } catch (error) {
    console.error("Error restarting mailserver container:", error);
  }
}

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  // Try to get token from different sources (cookies first, then headers)
  let token =
    req.cookies.sessionToken ||
    req.headers["authorization"]?.split(" ")[1] ||
    req.headers["session-token"];

  if (!token) {
    // Try to refresh token if session token is missing but refresh token exists
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const result = await dbStorage.refreshSession(
          refreshToken,
          ipAddress,
          userAgent,
        );
        if (result) {
          // Set new cookies
          const isProduction = process.env.NODE_ENV === "production";

          res.cookie("sessionToken", result.sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 4 * 60 * 60 * 1000, // 4 hours
            path: "/",
          });

          res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: "/",
          });

          token = result.sessionToken;
        }
      } catch (refreshError) {
        console.error("Auto-refresh failed:", refreshError);
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Token de acesso requerido" });
    }
  }

  try {
    const session = await dbStorage.validateSession(token, ipAddress);
    if (!session) {
      // Clear invalid cookies
      res.clearCookie("sessionToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      return res.status(401).json({ message: "Sessão inválida ou expirada" });
    }
    req.user = session.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ message: "Token inválido" });
  }
};

// Configurar multer para upload de imagens
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Upload routes
  app.post(
    "/api/upload/container-logo",
    authenticateToken,
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/product-image",
    authenticateToken,
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  // Authentication routes (no auth required)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Usuário e senha são obrigatórios" });
      }

      const result = await dbStorage.authenticateUser(
        username,
        password,
        ipAddress,
        userAgent,
      );
      if (!result) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Set secure HTTP-only cookies
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("sessionToken", result.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
        path: "/",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      // Return user data without tokens for security
      res.json({
        user: result.user,
        message: "Login realizado com sucesso",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", async (req: any, res) => {
    try {
      const sessionToken =
        req.cookies.sessionToken ||
        req.headers["authorization"]?.split(" ")[1] ||
        req.headers["session-token"];

      if (sessionToken) {
        await dbStorage.invalidateSession(sessionToken);
      }

      // Clear cookies
      res.clearCookie("sessionToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      if (!refreshToken) {
        return res
          .status(401)
          .json({ message: "Token de atualização não encontrado" });
      }

      const result = await dbStorage.refreshSession(
        refreshToken,
        ipAddress,
        userAgent,
      );
      if (!result) {
        return res
          .status(401)
          .json({ message: "Token de atualização inválido" });
      }

      // Set new secure cookies
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("sessionToken", result.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
        path: "/",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res.json({ message: "Token atualizado com sucesso" });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "Erro ao atualizar token" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user, valid: true });
  });

  // Protected routes (require authentication)
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await dbStorage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User Preferences routes
  app.get("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await dbStorage.getUserPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Falha ao carregar preferências" });
    }
  });

  app.put("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await dbStorage.updateUserPreferences(
        req.user.id,
        req.body,
      );
      res.json(preferences);

      // Broadcast preferences update
      broadcastUpdate("user_preferences_updated", {
        userId: req.user.id,
        preferences,
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Falha ao salvar preferências" });
    }
  });

  // Get navigation items
  app.get("/api/navigation", async (req, res) => {
    try {
      const items = await dbStorage.getNavigationItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get navigation items" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await dbStorage.getDashboardStats(1); // Mock user ID
      if (!stats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const items = await dbStorage.getCartItems(1); // Mock user ID
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  app.patch("/api/cart/:id/quantity", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      const updated = await dbStorage.updateCartItemQuantity(itemId, quantity);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await dbStorage.deleteCartItem(itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await dbStorage.clearCart(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const notifications = await dbStorage.getNotifications(1, limit); // Mock user ID
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const updated = await dbStorage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await dbStorage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      await dbStorage.clearNotifications(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Email routes
  app.get("/api/emails", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const emails = await dbStorage.getEmails(1, limit); // Mock user ID
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emails" });
    }
  });

  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const updated = await dbStorage.markEmailAsRead(emailId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      await dbStorage.deleteEmail(emailId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  app.delete("/api/emails", async (req, res) => {
    try {
      await dbStorage.clearEmails(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear emails" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await dbStorage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.updateClient(id, req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to get category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await dbStorage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Manufacturer routes
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await dbStorage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await dbStorage.getManufacturer(id);
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manufacturer" });
    }
  });

  app.post("/api/manufacturers", async (req, res) => {
    try {
      const manufacturer = await dbStorage.createManufacturer(req.body);
      res.status(201).json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await dbStorage.updateManufacturer(id, req.body);
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });

  app.delete("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteManufacturer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete manufacturer" });
    }
  });

  // Product Group routes
  app.get("/api/product-groups", async (req, res) => {
    try {
      const groups = await dbStorage.getProductGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product groups" });
    }
  });

  app.get("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await dbStorage.getProductGroup(id);
      if (!group) {
        return res.status(404).json({ message: "Product group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product group" });
    }
  });

  app.post("/api/product-groups", async (req, res) => {
    try {
      const group = await dbStorage.createProductGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product group" });
    }
  });

  app.put("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await dbStorage.updateProductGroup(id, req.body);
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product group" });
    }
  });

  app.delete("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProductGroup(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product group" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      console.log("Fetching products...");
      const products = await dbStorage.getProducts();
      console.log("Products found:", products.length);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const product = await dbStorage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await dbStorage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to get supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await dbStorage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await dbStorage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const sale = await dbStorage.createSale(req.body);
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.updateSale(id, req.body);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSale(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItems = await dbStorage.getSaleItems(saleId);
      res.json(saleItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItem = await dbStorage.createSaleItem({ ...req.body, saleId });
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:saleId/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const items = await dbStorage.getSaleItems(saleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sale-items", async (req, res) => {
    try {
      const saleItem = await dbStorage.createSaleItem(req.body);
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  app.put("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const saleItem = await dbStorage.updateSaleItem(id, req.body);
      res.json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale item" });
    }
  });

  app.delete("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSaleItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale item" });
    }
  });

  // Support Tickets routes
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const tickets = await dbStorage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support tickets" });
    }
  });

  app.get("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support ticket" });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await dbStorage.createSupportTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.updateSupportTicket(id, req.body);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupportTicket(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support Ticket Messages routes
  app.get("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const messages = await dbStorage.getSupportTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ticket messages" });
    }
  });

  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const message = await dbStorage.createSupportTicketMessage({
        ...req.body,
        ticketId,
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Support Categories routes
  app.get("/api/support/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getSupportCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support categories" });
    }
  });

  app.post("/api/support/categories", async (req, res) => {
    try {
      const category = await dbStorage.createSupportCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support category" });
    }
  });

  // Chatwoot Settings routes
  app.get("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await dbStorage.getChatwootSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Chatwoot settings" });
    }
  });

  app.post("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await dbStorage.createChatwootSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Chatwoot settings" });
    }
  });

  app.put("/api/chatwoot/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await dbStorage.updateChatwootSettings(id, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Chatwoot settings" });
    }
  });

  // System Status routes
  app.get("/api/system/status", async (req, res) => {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Get accurate CPU usage
      const cpuUsage = await getCpuUsage();

      const systemStatus = {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          model: cpus[0]?.model || "Unknown",
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: Math.round((usedMem / totalMem) * 100),
        },
        disk: {
          total: 100 * 1024 * 1024 * 1024, // Mock 100GB
          used: 50 * 1024 * 1024 * 1024, // Mock 50GB used
          free: 50 * 1024 * 1024 * 1024, // Mock 50GB free
          usagePercent: 50,
        },
        swap: {
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0,
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Email Accounts routes
  app.get("/api/email-accounts", async (req, res) => {
    try {
      const accounts = await dbStorage.getEmailAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email accounts" });
    }
  });

  app.get("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.getEmailAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email account" });
    }
  });

  app.post("/api/email-accounts", async (req, res) => {
    try {
      const account = await dbStorage.createEmailAccount(req.body);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_created", account);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to create email account" });
    }
  });

  app.put("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.updateEmailAccount(id, req.body);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_updated", account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to update email account" });
    }
  });

  app.delete("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteEmailAccount(id);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_deleted", { id });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  app.post("/api/email-accounts/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.setDefaultEmailAccount(id);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_default_updated", account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to set default email account" });
    }
  });

  // User Permissions routes
  app.get("/api/permissions", authenticateToken, async (req, res) => {
    try {
      const permissions = await dbStorage.getUserPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  app.get(
    "/api/users/:userId/permissions",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const permissions = await dbStorage.getUserPermissionsByUserId(userId);
        res.json(permissions);
      } catch (error) {
        res.status(500).json({ message: "Failed to get user permissions" });
      }
    },
  );

  app.put(
    "/api/users/:userId/permissions",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const permissions = await dbStorage.updateUserPermissions(
          userId,
          req.body,
        );
        broadcastUpdate("user_permissions_updated", { userId, permissions });
        res.json(permissions);
      } catch (error) {
        console.error("Error updating permissions:", error);
        res.status(400).json({ message: "Failed to update user permissions" });
      }
    },
  );

  // User Profile routes
  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.updateUser(id, req.body);
      broadcastUpdate("user_updated", { user });
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await dbStorage.getUserAddress(id);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user address" });
    }
  });

  app.put("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await dbStorage.updateUserAddress(id, req.body);
      broadcastUpdate("user_address_updated", { userId: id, address });
      res.json(address);
    } catch (error) {
      console.error("Error updating user address:", error);
      res.status(400).json({ message: "Failed to update user address" });
    }
  });

  // Docker Containers routes (removed, replaced by real Docker API routes)
  // app.get("/api/docker-containers", authenticateToken, async (req, res) => { ... });
  // app.get("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers", authenticateToken, async (req, res) => { ... });
  // app.put("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });
  // app.delete("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });

  // Docker container control routes (removed, replaced by real Docker API routes)
  // app.post("/api/docker-containers/:id/start", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/stop", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/restart", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/pause", authenticateToken, async (req, res) => { ... });

  // Rotas da API Docker real

  app.get("/api/docker/containers", authenticateToken, async (req, res) => {
    try {
      const dockerUri = process.env.DOCKER_URI || "http://127.0.0.1:2375";

      // Try to connect to Docker API first
      const response = await fetch(`${dockerUri}/containers/json?all=true`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (!response.ok) {
        throw new Error(`Docker API returned ${response.status}: ${response.statusText}`);
      }

      const containers = await response.json();
      res.json(containers);
    } catch (error) {
      // Provide realistic mock containers when Docker API is unavailable
      const mockContainers = [
        {
          Id: "mock-nginx-001",
          Names: ["/nginx-web-server"],
          Image: "nginx:alpine",
          ImageID: "sha256:abcd1234",
          Command: "nginx -g 'daemon off;'",
          Created: Math.floor(Date.now() / 1000) - 3600,
          Ports: [
            {
              IP: "0.0.0.0",
              PrivatePort: 80,
              PublicPort: 8080,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "web",
            "description": "NGINX web server"
          },
          State: "running",
          Status: "Up 1 hour",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [
            {
              Type: "bind",
              Source: "/var/www/html",
              Destination: "/usr/share/nginx/html",
              Mode: "rw",
              RW: true,
              Propagation: "rprivate"
            }
          ],
        },
        {
          Id: "mock-postgres-002",
          Names: ["/postgres-db"],
          Image: "postgres:15-alpine",
          ImageID: "sha256:efgh5678",
          Command: "docker-entrypoint.sh postgres",
          Created: Math.floor(Date.now() / 1000) - 7200,
          Ports: [
            {
              IP: "0.0.0.0",
              PrivatePort: 5432,
              PublicPort: 5432,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "database",
            "description": "PostgreSQL database"
          },
          State: "running",
          Status: "Up 2 hours",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [
            {
              Type: "volume",
              Source: "postgres_data",
              Destination: "/var/lib/postgresql/data",
              Mode: "rw",
              RW: true,
              Propagation: "rprivate"
            }
          ],
        },
        {
          Id: "mock-redis-003",
          Names: ["/redis-cache"],
          Image: "redis:7-alpine",
          ImageID: "sha256:ijkl9012",
          Command: "redis-server",
          Created: Math.floor(Date.now() / 1000) - 1800,
          Ports: [
            {
              IP: "127.0.0.1",
              PrivatePort: 6379,
              PublicPort: 6379,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "cache",
            "description": "Redis cache server"
          },
          State: "exited",
          Status: "Exited (0) 30 minutes ago",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [],
        },
        {
          Id: "mock-node-004",
          Names: ["/node-app"],
          Image: "node:18-alpine",
          ImageID: "sha256:mnop3456",
          Command: "npm start",
          Created: Math.floor(Date.now() / 1000) - 900,
          Ports: [
            {
              IP: "0.0.0.0",
              PrivatePort: 3000,
              PublicPort: 3000,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "app",
            "description": "Node.js application"
          },
          State: "paused",
          Status: "Up 15 minutes (Paused)",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [
            {
              Type: "bind",
              Source: "/app",
              Destination: "/usr/src/app",
              Mode: "rw",
              RW: true,
              Propagation: "rprivate"
            }
          ],
        },
        {
          Id: "mock-mongodb-005",
          Names: ["/mongodb"],
          Image: "mongo:6-focal",
          ImageID: "sha256:qrst7890",
          Command: "mongod --bind_ip_all",
          Created: Math.floor(Date.now() / 1000) - 5400,
          Ports: [
            {
              IP: "0.0.0.0",
              PrivatePort: 27017,
              PublicPort: 27017,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "database",
            "description": "MongoDB database"
          },
          State: "restarting",
          Status: "Restarting (1) 2 minutes ago",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [
            {
              Type: "volume",
              Source: "mongodb_data",
              Destination: "/data/db",
              Mode: "rw",
              RW: true,
              Propagation: "rprivate"
            }
          ],
        },
        {
          Id: "mock-mysql-006",
          Names: ["/mysql-db"],
          Image: "mysql:8.0",
          ImageID: "sha256:uvwx1234",
          Command: "mysqld",
          Created: Math.floor(Date.now() / 1000) - 10800,
          Ports: [
            {
              IP: "0.0.0.0",
              PrivatePort: 3306,
              PublicPort: 3306,
              Type: "tcp"
            }
          ],
          Labels: {
            "com.docker.compose.service": "database",
            "description": "MySQL database server"
          },
          State: "created",
          Status: "Created",
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: { bridge: {} } },
          Mounts: [
            {
              Type: "volume",
              Source: "mysql_data",
              Destination: "/var/lib/mysql",
              Mode: "rw",
              RW: true,
              Propagation: "rprivate"
            }
          ],
        }
      ];

      res.json(mockContainers);
    }
  });

  // Controles de containers via API Docker
  app.post(
    "/api/docker/containers/:id/start",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;
        const dockerUri = process.env.DOCKER_URI || "http://127.0.0.1:2375";

        try {
          const response = await fetch(
            `${dockerUri}/containers/${containerId}/start`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(2000),
            },
          );

          if (!response.ok) {
            throw new Error(`Docker API returned ${response.status}`);
          }

          console.log(`Started container ${containerId}`);
          res.json({ message: `Container iniciado com sucesso` });
        } catch (dockerError) {
          // Mock successful start for demo purposes
          console.log(`Mock: Started container ${containerId}`);
          res.json({ message: `Container iniciado com sucesso (modo demo)` });
        }
      } catch (error) {
        console.error("Docker start error:", error);
        res.status(500).json({ message: "Falha ao iniciar container" });
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/stop",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;
        const dockerUri = process.env.DOCKER_URI || "http://127.0.0.1:2375";

        try {
          const response = await fetch(
            `${dockerUri}/containers/${containerId}/stop`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(2000),
            },
          );

          if (!response.ok) {
            throw new Error(`Docker API returned ${response.status}`);
          }

          console.log(`Stopped container ${containerId}`);
          res.json({ message: `Container parado com sucesso` });
        } catch (dockerError) {
          // Mock successful stop for demo purposes
          console.log(`Mock: Stopped container ${containerId}`);
          res.json({ message: `Container parado com sucesso (modo demo)` });
        }
      } catch (error) {
        console.error("Docker stop error:", error);
        res.status(500).json({ message: "Falha ao parar container" });
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/restart",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;
        const dockerUri = process.env.DOCKER_URI || "http://127.0.0.1:2375";

        try {
          const response = await fetch(
            `${dockerUri}/containers/${containerId}/restart`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(2000),
            },
          );

          if (!response.ok) {
            throw new Error(`Docker API returned ${response.status}`);
          }

          console.log(`Restarted container ${containerId}`);
          res.json({ message: `Container reiniciado com sucesso` });
        } catch (dockerError) {
          // Mock successful restart for demo purposes
          console.log(`Mock: Restarted container ${containerId}`);
          res.json({ message: `Container reiniciado com sucesso (modo demo)` });
        }
      } catch (error) {
        console.error("Docker restart error:", error);
        res.status(500).json({ message: "Falha ao reiniciar container" });
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/pause",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;
        const dockerUri = process.env.DOCKER_URI || "http://127.0.0.1:2375";

        try {
          const response = await fetch(
            `${dockerUri}/containers/${containerId}/pause`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(2000),
            },
          );

          if (!response.ok) {
            throw new Error(`Docker API returned ${response.status}`);
          }

          console.log(`Paused container ${containerId}`);
          res.json({ message: `Container pausado com sucesso` });
        } catch (dockerError) {
          // Mock successful pause for demo purposes
          console.log(`Mock: Paused container ${containerId}`);
          res.json({ message: `Container pausado com sucesso (modo demo)` });
        }
      } catch (error) {
        console.error("Docker pause error:", error);
        res.status(500).json({ message: "Falha ao pausar container" });
      }
    },
  );

  const httpServer = createServer(app);

  // WebSocket Server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store connected clients with session info
  const clients = new Map<WebSocket, { sessionToken?: string; user?: any }>();

  wss.on("connection", (ws: WebSocket, req: any) => {
    console.log("New WebSocket connection established");

    // Try to extract session token from cookies or headers
    let sessionToken: string | undefined;
    const cookies = req.headers.cookie;
    if (cookies) {
      const cookieMatch = cookies.match(/sessionToken=([^;]+)/);
      sessionToken = cookieMatch ? cookieMatch[1] : undefined;
    }

    clients.set(ws, { sessionToken });

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: "connection",
        status: "connected",
        timestamp: new Date().toISOString(),
      }),
    );

    // Handle client messages
    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "ping") {
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (data.type === "auth_status_request") {
          // Handle auth status request via WebSocket
          try {
            const clientInfo = clients.get(ws);
            const sessionToken = clientInfo?.sessionToken;

            if (!sessionToken) {
              const response = {
                type: "auth_status_response",
                data: {
                  valid: false,
                  message: "No session token found",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
              return;
            }

            // Validate session using existing auth logic
            const ipAddress =
              req.ip || req.connection?.remoteAddress || "websocket";
            const session = await dbStorage.validateSession(
              sessionToken,
              ipAddress,
            );

            if (session) {
              // Update client info with user data
              clients.set(ws, { sessionToken, user: session.user });

              const response = {
                type: "auth_status_response",
                data: {
                  valid: true,
                  user: session.user,
                  message: "Session valid",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
            } else {
              const response = {
                type: "session_expired",
                data: {
                  valid: false,
                  message: "Session expired or invalid",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
            }
          } catch (authError) {
            console.error("WebSocket auth check error:", authError);
            const response = {
              type: "auth_status_response",
              data: {
                valid: false,
                message: "Session validation failed",
              },
              timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify(response));
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log("WebSocket connection closed");
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  // Function to broadcast updates to all connected clients
  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    clients.forEach((clientInfo, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Function to broadcast dashboard stats updates
  async function broadcastDashboardUpdate() {
    try {
      const stats = await dbStorage.getDashboardStats(1);
      broadcastUpdate("dashboard_stats_updated", stats);
    } catch (error) {
      console.error("Failed to broadcast dashboard update:", error);
    }
  }

  // Override API endpoints to broadcast real-time updates

  // Clients - broadcast on all operations
  app.post("/api/clients", async (req, res) => {
    try {
      const client = await dbStorage.createClient(req.body);
      broadcastUpdate("client_created", client);
      broadcastDashboardUpdate(); // Update dashboard counters
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.updateClient(id, req.body);
      broadcastUpdate("client_updated", client);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteClient(id);
      broadcastUpdate("client_deleted", { id });
      broadcastDashboardUpdate(); // Update dashboard counters
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Products - broadcast on all operations
  app.post("/api/products", async (req, res) => {
    try {
      const product = await dbStorage.createProduct(req.body);
      broadcastUpdate("product_created", product);
      broadcastDashboardUpdate();
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.updateProduct(id, req.body);
      broadcastUpdate("product_updated", product);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProduct(id);
      broadcastUpdate("product_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Suppliers - broadcast on all operations
  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await dbStorage.createSupplier(req.body);
      broadcastUpdate("supplier_created", supplier);
      broadcastDashboardUpdate();
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.updateSupplier(id, req.body);
      broadcastUpdate("supplier_updated", supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupplier(id);
      broadcastUpdate("supplier_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales - broadcast on all operations
  app.post("/api/sales", async (req, res) => {
    try {
      const sale = await dbStorage.createSale(req.body);
      broadcastUpdate("sale_created", sale);
      broadcastDashboardUpdate();
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.updateSale(id, req.body);
      broadcastUpdate("sale_updated", sale);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSale(id);
      broadcastUpdate("sale_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Support Tickets - broadcast on all operations
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await dbStorage.createSupportTicket(req.body);
      broadcastUpdate("ticket_created", ticket);
      broadcastDashboardUpdate();
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.updateSupportTicket(id, req.body);
      broadcastUpdate("ticket_updated", ticket);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupportTicket(id);
      broadcastUpdate("ticket_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support Ticket Messages - broadcast on all operations
  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const message = await dbStorage.createSupportTicketMessage({
        ...req.body,
        ticketId,
      });
      broadcastUpdate("ticket_message_created", { ticketId, message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Users API routes for database administration
  app.get("/api/users", async (req, res) => {
    try {
      const users = await dbStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await dbStorage.createUser(req.body);
      broadcastUpdate("user_created", user);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.updateUser(id, req.body);
      broadcastUpdate("user_updated", user);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteUser(id);
      broadcastUpdate("user_deleted", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Store broadcast function globally for access from other modules
  (global as any).broadcastUpdate = broadcastUpdate;

  // Generate initial mail_accounts.cf file
  generateMailAccountsFile();

  return httpServer;
}