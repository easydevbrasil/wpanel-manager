import { 
  users, 
  navigationItems, 
  dashboardStats, 
  cartItems,
  notifications,
  emails,
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
  type InsertEmail
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private navigationItems: Map<number, NavigationItem>;
  private dashboardStats: Map<number, DashboardStats>;
  private cartItems: Map<number, CartItem>;
  private notifications: Map<number, Notification>;
  private emails: Map<number, Email>;
  private currentUserId: number;
  private currentNavId: number;
  private currentStatsId: number;
  private currentCartId: number;
  private currentNotificationId: number;
  private currentEmailId: number;

  constructor() {
    this.users = new Map();
    this.navigationItems = new Map();
    this.dashboardStats = new Map();
    this.cartItems = new Map();
    this.notifications = new Map();
    this.emails = new Map();
    this.currentUserId = 1;
    this.currentNavId = 1;
    this.currentStatsId = 1;
    this.currentCartId = 1;
    this.currentNotificationId = 1;
    this.currentEmailId = 1;
    
    this.initializeData();
  }

  private initializeData() {
    // Create demo user
    const user: User = {
      id: 1,
      username: "john.smith",
      password: "password",
      name: "John Smith",
      role: "Product Manager",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    };
    this.users.set(1, user);
    this.currentUserId = 2;

    // Create navigation items
    const navItems: NavigationItem[] = [
      { id: 1, label: "Dashboard", icon: "LayoutDashboard", href: "/", parentId: null, order: 1 },
      { id: 2, label: "Overview", icon: "Eye", href: "/dashboard/overview", parentId: 1, order: 1 },
      { id: 3, label: "Analytics", icon: "BarChart3", href: "/dashboard/analytics", parentId: 1, order: 2 },
      { id: 4, label: "Reports", icon: "FileText", href: "/dashboard/reports", parentId: 1, order: 3 },
      
      { id: 5, label: "Projects", icon: "FolderOpen", href: "/projects", parentId: null, order: 2 },
      { id: 6, label: "All Projects", icon: "Folder", href: "/projects/all", parentId: 5, order: 1 },
      { id: 7, label: "My Projects", icon: "User", href: "/projects/mine", parentId: 5, order: 2 },
      { id: 8, label: "Templates", icon: "Copy", href: "/projects/templates", parentId: 5, order: 3 },
      
      { id: 9, label: "Team", icon: "Users", href: "/team", parentId: null, order: 3 },
      
      { id: 10, label: "Settings", icon: "Settings", href: "/settings", parentId: null, order: 4 },
      { id: 11, label: "General", icon: "Sliders", href: "/settings/general", parentId: 10, order: 1 },
      { id: 12, label: "Security", icon: "Shield", href: "/settings/security", parentId: 10, order: 2 },
      { id: 13, label: "Notifications", icon: "Bell", href: "/settings/notifications", parentId: 10, order: 3 },
    ];

    navItems.forEach(item => {
      this.navigationItems.set(item.id, item);
    });
    this.currentNavId = 14;

    // Create dashboard stats
    const stats: DashboardStats = {
      id: 1,
      userId: 1,
      cartCount: 3,
      notificationCount: 12,
      emailCount: 5,
      stats: {
        totalProjects: 24,
        activeTasks: 142,
        teamMembers: 18,
        revenue: 12500
      }
    };
    this.dashboardStats.set(1, stats);
    this.currentStatsId = 2;

    // Create sample cart items
    const cartItemsData: CartItem[] = [
      { id: 1, userId: 1, productName: "Wireless Headphones", productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop", price: 9999, quantity: 2, createdAt: "2024-06-15T10:00:00Z" },
      { id: 2, userId: 1, productName: "Smartphone Case", productImage: "https://images.unsplash.com/photo-1601593346740-925612772716?w=100&h=100&fit=crop", price: 2999, quantity: 1, createdAt: "2024-06-15T11:00:00Z" },
      { id: 3, userId: 1, productName: "USB Cable", productImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop", price: 1599, quantity: 3, createdAt: "2024-06-15T12:00:00Z" },
    ];
    cartItemsData.forEach(item => this.cartItems.set(item.id, item));
    this.currentCartId = 4;

    // Create sample notifications
    const notificationsData: Notification[] = [
      { id: 1, userId: 1, title: "New Project Assigned", message: "You have been assigned to Project Alpha", type: "info", senderName: "Project Manager", senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face", serviceType: "push", isRead: false, createdAt: "2024-06-15T14:30:00Z" },
      { id: 2, userId: 1, title: "Task Completed", message: "Sarah completed the wireframes task", type: "success", senderName: "Sarah Chen", senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face", serviceType: "app", isRead: false, createdAt: "2024-06-15T13:15:00Z" },
      { id: 3, userId: 1, title: "Deadline Reminder", message: "Project Beta deadline is tomorrow", type: "warning", senderName: "System", senderAvatar: null, serviceType: "system", isRead: true, createdAt: "2024-06-15T10:45:00Z" },
      { id: 4, userId: 1, title: "System Update", message: "System will be updated tonight at 2 AM", type: "info", senderName: "Admin", senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face", serviceType: "system", isRead: false, createdAt: "2024-06-15T09:20:00Z" },
      { id: 5, userId: 1, title: "Budget Approved", message: "Q3 budget has been approved", type: "success", senderName: "Mike Rodriguez", senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face", serviceType: "push", isRead: false, createdAt: "2024-06-15T08:00:00Z" },
    ];
    notificationsData.forEach(notification => this.notifications.set(notification.id, notification));
    this.currentNotificationId = 6;

    // Create sample emails
    const emailsData: Email[] = [
      { id: 1, userId: 1, sender: "Sarah Chen", senderEmail: "sarah@company.com", senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face", subject: "Project Update", preview: "The wireframes are ready for review...", serviceType: "email", isRead: false, createdAt: "2024-06-15T15:30:00Z" },
      { id: 2, userId: 1, sender: "Mike Rodriguez", senderEmail: "mike@company.com", senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face", subject: "Code Review Request", preview: "Please review the latest commits...", serviceType: "whatsapp", isRead: false, createdAt: "2024-06-15T14:45:00Z" },
      { id: 3, userId: 1, sender: "Team Lead", senderEmail: "lead@company.com", senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face", subject: "Weekly Meeting", preview: "Weekly team meeting scheduled for...", serviceType: "email", isRead: true, createdAt: "2024-06-15T13:20:00Z" },
      { id: 4, userId: 1, sender: "HR Department", senderEmail: "hr@company.com", senderAvatar: null, subject: "Benefits Update", preview: "New benefits package information...", serviceType: "email", isRead: false, createdAt: "2024-06-15T11:10:00Z" },
      { id: 5, userId: 1, sender: "Client Support", senderEmail: "support@client.com", senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face", subject: "Feature Request", preview: "Client requesting new dashboard features...", serviceType: "telegram", isRead: false, createdAt: "2024-06-15T10:30:00Z" },
    ];
    emailsData.forEach(email => this.emails.set(email.id, email));
    this.currentEmailId = 6;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getNavigationItems(): Promise<NavigationItem[]> {
    return Array.from(this.navigationItems.values()).sort((a, b) => a.order - b.order);
  }

  async createNavigationItem(insertItem: InsertNavigationItem): Promise<NavigationItem> {
    const id = this.currentNavId++;
    const item: NavigationItem = { ...insertItem, id };
    this.navigationItems.set(id, item);
    return item;
  }

  async getDashboardStats(userId: number): Promise<DashboardStats | undefined> {
    return Array.from(this.dashboardStats.values()).find(stats => stats.userId === userId);
  }

  async updateDashboardStats(userId: number, updates: Partial<InsertDashboardStats>): Promise<DashboardStats> {
    const existing = await this.getDashboardStats(userId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.dashboardStats.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentStatsId++;
      const stats: DashboardStats = { id, userId, cartCount: 0, notificationCount: 0, emailCount: 0, stats: null, ...updates };
      this.dashboardStats.set(id, stats);
      return stats;
    }
  }

  // Cart Items
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async updateCartItemQuantity(itemId: number, quantity: number): Promise<CartItem> {
    const item = this.cartItems.get(itemId);
    if (!item) throw new Error("Cart item not found");
    const updated = { ...item, quantity };
    this.cartItems.set(itemId, updated);
    return updated;
  }

  async deleteCartItem(itemId: number): Promise<void> {
    this.cartItems.delete(itemId);
  }

  async clearCart(userId: number): Promise<void> {
    const userItems = await this.getCartItems(userId);
    userItems.forEach(item => this.cartItems.delete(item.id));
  }

  // Notifications
  async getNotifications(userId: number, limit = 10): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const notification = this.notifications.get(notificationId);
    if (!notification) throw new Error("Notification not found");
    const updated = { ...notification, isRead: true };
    this.notifications.set(notificationId, updated);
    return updated;
  }

  async deleteNotification(notificationId: number): Promise<void> {
    this.notifications.delete(notificationId);
  }

  async clearNotifications(userId: number): Promise<void> {
    const userNotifications = await this.getNotifications(userId, 1000);
    userNotifications.forEach(notification => this.notifications.delete(notification.id));
  }

  // Emails
  async getEmails(userId: number, limit = 10): Promise<Email[]> {
    return Array.from(this.emails.values())
      .filter(email => email.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async markEmailAsRead(emailId: number): Promise<Email> {
    const email = this.emails.get(emailId);
    if (!email) throw new Error("Email not found");
    const updated = { ...email, isRead: true };
    this.emails.set(emailId, updated);
    return updated;
  }

  async deleteEmail(emailId: number): Promise<void> {
    this.emails.delete(emailId);
  }

  async clearEmails(userId: number): Promise<void> {
    const userEmails = await this.getEmails(userId, 1000);
    userEmails.forEach(email => this.emails.delete(email.id));
  }
}

export const storage = new MemStorage();
