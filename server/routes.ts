import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (mocked for demo)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1); // Mock user ID
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
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

  app.post("/api/clients", async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
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

  const httpServer = createServer(app);
  return httpServer;
}
