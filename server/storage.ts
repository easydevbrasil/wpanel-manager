import { 
  users, 
  navigationItems, 
  dashboardStats, 
  cartItems,
  notifications,
  emails,
  clients,
  type User, 
  type NavigationItem, 
  type DashboardStats, 
  type InsertUser, 
  type InsertNavigationItem, 
  type InsertDashboardStats,
  type CartItem,
  type InsertCartItem,
  type Notification,
  type InsertNotification,
  type Email,
  type InsertEmail,
  type Client,
  type InsertClient
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Navigation
  getNavigationItems(): Promise<NavigationItem[]>;
  createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem>;
  
  // Dashboard Stats
  getDashboardStats(userId: number): Promise<DashboardStats | undefined>;
  updateDashboardStats(userId: number, stats: Partial<InsertDashboardStats>): Promise<DashboardStats>;
  
  // Cart Items
  getCartItems(userId: number): Promise<CartItem[]>;
  updateCartItemQuantity(itemId: number, quantity: number): Promise<CartItem>;
  deleteCartItem(itemId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Notifications
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
  deleteNotification(notificationId: number): Promise<void>;
  clearNotifications(userId: number): Promise<void>;
  
  // Emails
  getEmails(userId: number, limit?: number): Promise<Email[]>;
  markEmailAsRead(emailId: number): Promise<Email>;
  deleteEmail(emailId: number): Promise<void>;
  clearEmails(userId: number): Promise<void>;
  
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Check if data already exists, if not create sample data
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        await this.createSampleData();
      }
    } catch (error) {
      console.log("Database not ready yet, will initialize on first request");
    }
  }

  private async createSampleData() {
    const now = new Date().toISOString();
    
    // Create sample user
    const [user] = await db.insert(users).values({
      username: "john.smith",
      password: "password123",
      name: "John Smith",
      role: "Admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    }).returning();

    // Create sample clients
    const clientsData = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@techcorp.com",
        phone: "+1 (555) 123-4567",
        company: "TechCorp Solutions",
        position: "CTO",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Key decision maker for enterprise solutions",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Michael Chen",
        email: "m.chen@innovate.io",
        phone: "+1 (555) 987-6543",
        company: "Innovate.io",
        position: "Product Manager",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Interested in AI integration features",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Emma Rodriguez",
        email: "emma@startuplab.com",
        phone: "+1 (555) 456-7890",
        company: "StartupLab",
        position: "Founder & CEO",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Looking for scalable solutions for rapid growth",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "David Wilson",
        email: "david.wilson@enterprise.com",
        phone: "+1 (555) 321-0987",
        company: "Enterprise Corp",
        position: "IT Director",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        status: "inactive",
        notes: "Former client, contract ended last quarter",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Lisa Anderson",
        email: "lisa@creativestudio.com",
        phone: "+1 (555) 654-3210",
        company: "Creative Studio",
        position: "Creative Director",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Specializes in design-focused applications",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Robert Kim",
        email: "robert@techventures.co",
        phone: "+1 (555) 789-0123",
        company: "Tech Ventures",
        position: "Investment Partner",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Potential investor and strategic partner",
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.insert(clients).values(clientsData);

    // Create navigation items
    const navItems = [
      { label: "Dashboard", icon: "LayoutDashboard", href: "/", order: 1, parentId: null },
      { label: "Clientes", icon: "Users", href: "/clients", order: 2, parentId: null },
      { label: "Projetos", icon: "FolderOpen", href: "/projects", order: 3, parentId: null },
      { label: "Relatórios", icon: "BarChart3", href: "/reports", order: 4, parentId: null }
    ];

    await db.insert(navigationItems).values(navItems);
  }

  // Database implementation methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getNavigationItems(): Promise<NavigationItem[]> {
    return await db.select().from(navigationItems).orderBy(navigationItems.order);
  }

  async createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> {
    const [navItem] = await db.insert(navigationItems).values(item).returning();
    return navItem;
  }

  async getDashboardStats(userId: number): Promise<DashboardStats | undefined> {
    return { id: 1, userId, cartCount: 3, notificationCount: 5, emailCount: 3, stats: null };
  }

  async updateDashboardStats(userId: number, updates: Partial<InsertDashboardStats>): Promise<DashboardStats> {
    return { id: 1, userId, cartCount: 3, notificationCount: 5, emailCount: 3, stats: null };
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return [];
  }

  async updateCartItemQuantity(itemId: number, quantity: number): Promise<CartItem> {
    throw new Error("Not implemented");
  }

  async deleteCartItem(itemId: number): Promise<void> {
    // Not implemented for now
  }

  async clearCart(userId: number): Promise<void> {
    // Not implemented for now
  }

  async getNotifications(userId: number, limit = 10): Promise<Notification[]> {
    return [];
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    throw new Error("Not implemented");
  }

  async deleteNotification(notificationId: number): Promise<void> {
    // Not implemented for now
  }

  async clearNotifications(userId: number): Promise<void> {
    // Not implemented for now
  }

  async getEmails(userId: number, limit = 10): Promise<Email[]> {
    return [];
  }

  async markEmailAsRead(emailId: number): Promise<Email> {
    throw new Error("Not implemented");
  }

  async deleteEmail(emailId: number): Promise<void> {
    // Not implemented for now
  }

  async clearEmails(userId: number): Promise<void> {
    // Not implemented for now
  }

  // Client CRUD operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const now = new Date().toISOString();
    const [newClient] = await db.insert(clients).values({
      ...client,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client> {
    const now = new Date().toISOString();
    const [updatedClient] = await db.update(clients)
      .set({ ...clientData, updatedAt: now })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }
}

export const storage = new DatabaseStorage();