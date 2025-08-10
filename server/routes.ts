import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";

// Function to generate mail_accounts.cf file
async function generateMailAccountsFile() {
  try {
    const accounts = await storage.getEmailAccounts();
    const lines = accounts.map(account => {
      // Create SHA512 hash in base64 format for Postfix compatibility
      const hash = crypto.createHash('sha512').update(account.password || '').digest('base64');
      return `${account.email}|{SHA512}${hash}`;
    });

    const filePath = path.join(process.cwd(), 'mail_accounts.cf');
    const content = lines.join('\n') + '\n';

    await fs.promises.writeFile(filePath, content, 'utf8');
    console.log(`Generated mail_accounts.cf with ${accounts.length} accounts`);
  } catch (error) {
    console.error('Error generating mail_accounts.cf:', error);
  }
}

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.headers['session-token'];

  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }

  try {
    const session = await storage.validateSession(token);
    if (!session) {
      return res.status(401).json({ message: "Sessão inválida ou expirada" });
    }
    req.user = session.user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
};

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', require('express').static(path.join(process.cwd(), 'uploads')));

  // Upload routes
  app.post("/api/upload/container-logo", authenticateToken, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: "Falha no upload da imagem" });
    }
  });

  app.post("/api/upload/product-image", authenticateToken, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: "Falha no upload da imagem" });
    }
  });

  // Authentication routes (no auth required)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
      }

      const result = await storage.authenticateUser(username, password);
      if (!result) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      const token = req.headers['authorization']?.split(' ')[1] || req.headers['session-token'];
      if (token) {
        await storage.invalidateSession(token);
      }
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user, valid: true });
  });

  // Protected routes (require authentication)
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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
      const preferences = await storage.getUserPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Falha ao carregar preferências" });
    }
  });

  app.put("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await storage.updateUserPreferences(req.user.id, req.body);
      res.json(preferences);

      // Broadcast preferences update
      broadcastUpdate('user_preferences_updated', {
        userId: req.user.id,
        preferences
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Falha ao salvar preferências" });
    }
  });

  // Get navigation items
  app.get("/api/navigation", async (req, res) => {
    try {
      const items = await storage.getNavigationItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get navigation items" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(1); // Mock user ID
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
      const items = await storage.getCartItems(1); // Mock user ID
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  app.patch("/api/cart/:id/quantity", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      const updated = await storage.updateCartItemQuantity(itemId, quantity);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteCartItem(itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await storage.clearCart(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const notifications = await storage.getNotifications(1, limit); // Mock user ID
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const updated = await storage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      await storage.clearNotifications(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Email routes
  app.get("/api/emails", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const emails = await storage.getEmails(1, limit); // Mock user ID
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emails" });
    }
  });

  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const updated = await storage.markEmailAsRead(emailId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      await storage.deleteEmail(emailId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  app.delete("/api/emails", async (req, res) => {
    try {
      await storage.clearEmails(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear emails" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
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
      const client = await storage.updateClient(id, req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
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
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Manufacturer routes
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.getManufacturer(id);
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
      const manufacturer = await storage.createManufacturer(req.body);
      res.status(201).json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.updateManufacturer(id, req.body);
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });

  app.delete("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete manufacturer" });
    }
  });

  // Product Group routes
  app.get("/api/product-groups", async (req, res) => {
    try {
      const groups = await storage.getProductGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product groups" });
    }
  });

  app.get("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getProductGroup(id);
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
      const group = await storage.createProductGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product group" });
    }
  });

  app.put("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.updateProductGroup(id, req.body);
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product group" });
    }
  });

  app.delete("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductGroup(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product group" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
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
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
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
      const sale = await storage.createSale(req.body);
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.updateSale(id, req.body);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSale(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItems = await storage.getSaleItems(saleId);
      res.json(saleItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItem = await storage.createSaleItem({ ...req.body, saleId });
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:saleId/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const items = await storage.getSaleItems(saleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sale-items", async (req, res) => {
    try {
      const saleItem = await storage.createSaleItem(req.body);
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  app.put("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const saleItem = await storage.updateSaleItem(id, req.body);
      res.json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale item" });
    }
  });

  app.delete("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSaleItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale item" });
    }
  });

  // Support Tickets routes
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support tickets" });
    }
  });

  app.get("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getSupportTicket(id);
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
      const ticket = await storage.createSupportTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.updateSupportTicket(id, req.body);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupportTicket(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support Ticket Messages routes
  app.get("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const messages = await storage.getSupportTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ticket messages" });
    }
  });

  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const message = await storage.createSupportTicketMessage({ ...req.body, ticketId });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Support Categories routes
  app.get("/api/support/categories", async (req, res) => {
    try {
      const categories = await storage.getSupportCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support categories" });
    }
  });

  app.post("/api/support/categories", async (req, res) => {
    try {
      const category = await storage.createSupportCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support category" });
    }
  });

  // Chatwoot Settings routes
  app.get("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await storage.getChatwootSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Chatwoot settings" });
    }
  });

  app.post("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await storage.createChatwootSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Chatwoot settings" });
    }
  });

  app.put("/api/chatwoot/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.updateChatwootSettings(id, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Chatwoot settings" });
    }
  });

  // System Status routes
  app.get("/api/system/status", async (req, res) => {
    try {
      const os = await import('os');
      const fs = await import('fs').then(m => m.promises);

      // Get CPU info
      const cpus = os.cpus();
      const cpuCount = cpus.length;
      const cpuModel = cpus[0]?.model || "Unknown CPU";

      // Calculate CPU usage
      let cpuUsage = 0;
      try {
        const loadavg = os.loadavg();
        cpuUsage = Math.min(Math.round((loadavg[0] / cpuCount) * 100), 100);
      } catch {
        cpuUsage = Math.floor(Math.random() * 30) + 20; // Fallback
      }

      // Get memory info
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = Math.round((usedMem / totalMem) * 100);

      // Get disk info (try to read from /proc/mounts or fallback)
      let diskInfo = {
        total: 20 * 1024 * 1024 * 1024,
        used: 8 * 1024 * 1024 * 1024,
        free: 12 * 1024 * 1024 * 1024,
        usagePercent: 40
      };

      try {
        const stats = await fs.statfs('/');
        const total = stats.bavail * stats.bsize;
        const free = stats.bavail * stats.bsize;
        const used = total - free;
        diskInfo = {
          total,
          used,
          free,
          usagePercent: Math.round((used / total) * 100)
        };
      } catch {
        // Keep fallback values
      }

      const systemStatus = {
        cpu: {
          usage: cpuUsage,
          cores: cpuCount,
          model: cpuModel
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: memUsagePercent
        },
        disk: diskInfo,
        swap: {
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Email Accounts routes
  app.get("/api/email-accounts", async (req, res) => {
    try {
      const accounts = await storage.getEmailAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email accounts" });
    }
  });

  app.get("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getEmailAccount(id);
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
      const account = await storage.createEmailAccount(req.body);
      await generateMailAccountsFile();
      broadcastUpdate('email_account_created', account);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to create email account" });
    }
  });

  app.put("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.updateEmailAccount(id, req.body);
      await generateMailAccountsFile();
      broadcastUpdate('email_account_updated', account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to update email account" });
    }
  });

  app.delete("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmailAccount(id);
      await generateMailAccountsFile();
      broadcastUpdate('email_account_deleted', { id });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  app.post("/api/email-accounts/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.setDefaultEmailAccount(id);
      await generateMailAccountsFile();
      broadcastUpdate('email_account_default_updated', account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to set default email account" });
    }
  });

  // User Permissions routes
  app.get("/api/permissions", authenticateToken, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  app.get("/api/users/:userId/permissions", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissions = await storage.getUserPermissionsByUserId(userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  app.put("/api/users/:userId/permissions", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissions = await storage.updateUserPermissions(userId, req.body);
      broadcastUpdate('user_permissions_updated', { userId, permissions });
      res.json(permissions);
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(400).json({ message: "Failed to update user permissions" });
    }
  });

  // User Profile routes
  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      broadcastUpdate('user_updated', { user });
      res.json(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.getUserAddress(id);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user address" });
    }
  });

  app.put("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.updateUserAddress(id, req.body);
      broadcastUpdate('user_address_updated', { userId: id, address });
      res.json(address);
    } catch (error) {
      console.error('Error updating user address:', error);
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
      const dockerUri = process.env.DOCKER_URI || 'http://localhost:2375';
      
      console.log(`Connecting to Docker API at: ${dockerUri}`);

      // Fazer chamada real para a API Docker
      const response = await fetch(`${dockerUri}/containers/json?all=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`Docker API returned ${response.status}: ${response.statusText}`);
      }

      const containers = await response.json();
      res.json(containers);
    } catch (error) {
      console.error('Docker API error:', error);
      
      // Fallback para containers mock se a API Docker não estiver disponível
      const mockContainers = [
        {
          Id: "error-fallback",
          Names: ["/docker-api-unavailable"],
          Image: "api-error",
          ImageID: "sha256:error",
          Command: "Docker API não disponível",
          Created: Math.floor(Date.now() / 1000),
          Ports: [],
          Labels: {},
          State: "exited",
          Status: `Docker API indisponível em ${process.env.DOCKER_URI || 'http://localhost:2375'}`,
          HostConfig: { NetworkMode: "bridge" },
          NetworkSettings: { Networks: {} },
          Mounts: []
        }
      ];

      res.json(mockContainers);
    }
  });

  // Controles de containers via API Docker
  app.post("/api/docker/containers/:id/start", authenticateToken, async (req, res) => {
    try {
      const containerId = req.params.id;
      const dockerUri = process.env.DOCKER_URI || 'http://localhost:2375';

      const response = await fetch(`${dockerUri}/containers/${containerId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`Docker API error: ${response.status}`);
      }

      console.log(`Started container ${containerId}`);
      res.json({ message: `Container ${containerId} iniciado com sucesso` });
    } catch (error) {
      console.error('Docker start error:', error);
      res.status(500).json({ message: "Falha ao iniciar container" });
    }
  });

  app.post("/api/docker/containers/:id/stop", authenticateToken, async (req, res) => {
    try {
      const containerId = req.params.id;
      const dockerUri = process.env.DOCKER_URI || 'http://localhost:2375';

      const response = await fetch(`${dockerUri}/containers/${containerId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`Docker API error: ${response.status}`);
      }

      console.log(`Stopped container ${containerId}`);
      res.json({ message: `Container ${containerId} parado com sucesso` });
    } catch (error) {
      console.error('Docker stop error:', error);
      res.status(500).json({ message: "Falha ao parar container" });
    }
  });

  app.post("/api/docker/containers/:id/restart", authenticateToken, async (req, res) => {
    try {
      const containerId = req.params.id;
      const dockerUri = process.env.DOCKER_URI || 'http://localhost:2375';

      const response = await fetch(`${dockerUri}/containers/${containerId}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`Docker API error: ${response.status}`);
      }

      console.log(`Restarted container ${containerId}`);
      res.json({ message: `Container ${containerId} reiniciado com sucesso` });
    } catch (error) {
      console.error('Docker restart error:', error);
      res.status(500).json({ message: "Falha ao reiniciar container" });
    }
  });

  app.post("/api/docker/containers/:id/pause", authenticateToken, async (req, res) => {
    try {
      const containerId = req.params.id;
      const dockerUri = process.env.DOCKER_URI || 'http://localhost:2375';

      const response = await fetch(`${dockerUri}/containers/${containerId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`Docker API error: ${response.status}`);
      }

      console.log(`Paused container ${containerId}`);
      res.json({ message: `Container ${containerId} pausado com sucesso` });
    } catch (error) {
      console.error('Docker pause error:', error);
      res.status(500).json({ message: "Falha ao pausar container" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket Server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    clients.add(ws);

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      timestamp: new Date().toISOString()
    }));

    // Handle client messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Function to broadcast updates to all connected clients
  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Function to broadcast dashboard stats updates
  async function broadcastDashboardUpdate() {
    try {
      const stats = await storage.getDashboardStats(1);
      broadcastUpdate('dashboard_stats_updated', stats);
    } catch (error) {
      console.error('Failed to broadcast dashboard update:', error);
    }
  }

  // Override API endpoints to broadcast real-time updates

  // Clients - broadcast on all operations
  app.post("/api/clients", async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      broadcastUpdate('client_created', client);
      broadcastDashboardUpdate(); // Update dashboard counters
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.updateClient(id, req.body);
      broadcastUpdate('client_updated', client);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      broadcastUpdate('client_deleted', { id });
      broadcastDashboardUpdate(); // Update dashboard counters
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Products - broadcast on all operations
  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      broadcastUpdate('product_created', product);
      broadcastDashboardUpdate();
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      broadcastUpdate('product_updated', product);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      broadcastUpdate('product_deleted', { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Suppliers - broadcast on all operations
  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      broadcastUpdate('supplier_created', supplier);
      broadcastDashboardUpdate();
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      broadcastUpdate('supplier_updated', supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      broadcastUpdate('supplier_deleted', { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales - broadcast on all operations
  app.post("/api/sales", async (req, res) => {
    try {
      const sale = await storage.createSale(req.body);
      broadcastUpdate('sale_created', sale);
      broadcastDashboardUpdate();
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.updateSale(id, req.body);
      broadcastUpdate('sale_updated', sale);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSale(id);
      broadcastUpdate('sale_deleted', { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Support Tickets - broadcast on all operations
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await storage.createSupportTicket(req.body);
      broadcastUpdate('ticket_created', ticket);
      broadcastDashboardUpdate();
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.updateSupportTicket(id, req.body);
      broadcastUpdate('ticket_updated', ticket);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupportTicket(id);
      broadcastUpdate('ticket_deleted', { id });
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
      const message = await storage.createSupportTicketMessage({ ...req.body, ticketId });
      broadcastUpdate('ticket_message_created', { ticketId, message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Users API routes for database administration
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
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
      const user = await storage.createUser(req.body);
      broadcastUpdate('user_created', user);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      broadcastUpdate('user_updated', user);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      broadcastUpdate('user_deleted', { id });
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