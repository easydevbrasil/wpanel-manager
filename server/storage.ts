import { users, navigationItems, dashboardStats, type User, type NavigationItem, type DashboardStats, type InsertUser, type InsertNavigationItem, type InsertDashboardStats } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private navigationItems: Map<number, NavigationItem>;
  private dashboardStats: Map<number, DashboardStats>;
  private currentUserId: number;
  private currentNavId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.navigationItems = new Map();
    this.dashboardStats = new Map();
    this.currentUserId = 1;
    this.currentNavId = 1;
    this.currentStatsId = 1;
    
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
}

export const storage = new MemStorage();
