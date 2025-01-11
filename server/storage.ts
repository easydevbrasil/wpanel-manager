import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql, desc, asc, and, gte } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { db } from './db';

import {
  users,
  userPreferences,
  navigationItems,
  dashboardStats,
  cartItems,
  notifications,
  emails,
  clients,
  categories,
  manufacturers,
  productGroups,
  products,
  services,
  suppliers,
  providers,
  sales,
  saleItems,
  supportTickets,
  supportTicketMessages,
  supportCategories,
  chatwootSettings,
  emailAccounts,
  dockerContainers,
  webhookConfigs,
  sessions,
  userAddresses,
  scheduledTasks,
  taskExecutionLogs,
  taskTemplates,
  expenses,
  expenseCategories,
  paymentMethods,
  expenseReminders,
  exchangeRates,
  plans,
  planPaymentDiscounts,
  planSubscriptionDiscounts,
  planResources,
  planResourceAssignments,
  clientDiscountPlans,
  clientDiscountRules,
  type User,
  type UserPreferences,
  type InsertUserPreferences,
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
  type InsertClient,
  type Category,
  type InsertCategory,
  type Manufacturer,
  type InsertManufacturer,
  type ProductGroup,
  type InsertProductGroup,
  type Product,
  type InsertProduct,
  type Service,
  type InsertService,
  type Supplier,
  type InsertSupplier,
  type Provider,
  type InsertProvider,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportTicketMessage,
  type InsertSupportTicketMessage,
  type SupportCategory,
  type InsertSupportCategory,
  type ChatwootSettings,
  type InsertChatwootSettings,
  type EmailAccount,
  type InsertEmailAccount,
  type DockerContainer,
  type InsertDockerContainer,
  type WebhookConfig,
  type InsertWebhookConfig,
  type Session,
  type InsertSession,
  type UserAddress,
  type InsertUserAddress,
  type ScheduledTask,
  type InsertScheduledTask,
  type TaskExecutionLog,
  type InsertTaskExecutionLog,
  type TaskTemplate,
  type InsertTaskTemplate,
  type Expense,
  type InsertExpense,
  type ExpenseCategory,
  type InsertExpenseCategory,
  type PaymentMethod,
  type InsertPaymentMethod,
  type ExpenseReminder,
  type InsertExpenseReminder,
  type ExchangeRate,
  type InsertExchangeRate,
  type Plan,
  type InsertPlan,
  type PlanPaymentDiscount,
  type InsertPlanPaymentDiscount,
  type PlanSubscriptionDiscount,
  type InsertPlanSubscriptionDiscount,
  type PlanResource,
  type InsertPlanResource,
  type PlanResourceAssignment,
  type InsertPlanResourceAssignment,
  type ClientDiscountPlan,
  type InsertClientDiscountPlan,
  type ClientDiscountRule,
  type InsertClientDiscountRule
} from "../shared/schema";

export interface IStorage {
  // Authentication
  authenticateUser(username: string, password: string): Promise<{ user: User; sessionToken: string; refreshToken: string } | null>;
  validateSession(sessionToken: string): Promise<{ user: any } | null>;
  refreshSession(refreshToken: string): Promise<{ sessionToken: string; refreshToken: string } | null>;
  invalidateSession(sessionToken: string): Promise<void>;
  invalidateAllUserSessions(userId: number): Promise<void>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  // Navigation
  getNavigationItems(): Promise<NavigationItem[]>;
  createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem>;
  deleteNavigationItem(id: number): Promise<void>;

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

  // Client Discount Plans
  getClientDiscountPlans(): Promise<ClientDiscountPlan[]>;
  getClientDiscountPlan(id: number): Promise<ClientDiscountPlan | undefined>;
  createClientDiscountPlan(plan: InsertClientDiscountPlan): Promise<ClientDiscountPlan>;
  updateClientDiscountPlan(id: number, plan: Partial<InsertClientDiscountPlan>): Promise<ClientDiscountPlan>;
  deleteClientDiscountPlan(id: number): Promise<void>;

  // Client Discount Rules
  getClientDiscountRules(): Promise<ClientDiscountRule[]>;
  getClientDiscountRulesByPlan(planId: number): Promise<ClientDiscountRule[]>;
  createClientDiscountRule(rule: InsertClientDiscountRule): Promise<ClientDiscountRule>;
  updateClientDiscountRule(id: number, rule: Partial<InsertClientDiscountRule>): Promise<ClientDiscountRule>;
  deleteClientDiscountRule(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Manufacturers
  getManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer>;
  deleteManufacturer(id: number): Promise<void>;

  // Product Groups
  getProductGroups(): Promise<ProductGroup[]>;
  getProductGroup(id: number): Promise<ProductGroup | undefined>;
  createProductGroup(group: InsertProductGroup): Promise<ProductGroup>;
  updateProductGroup(id: number, group: Partial<InsertProductGroup>): Promise<ProductGroup>;
  deleteProductGroup(id: number): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  // Providers
  getProviders(): Promise<Provider[]>;
  getProvider(id: number): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider>;
  deleteProvider(id: number): Promise<void>;

  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: number): Promise<void>;

  // Sale Items
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;
  updateSaleItem(id: number, saleItem: Partial<InsertSaleItem>): Promise<SaleItem>;
  deleteSaleItem(id: number): Promise<void>;

  // Support Tickets
  getSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket>;
  deleteSupportTicket(id: number): Promise<void>;

  // Support Ticket Messages
  getSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]>;
  createSupportTicketMessage(message: InsertSupportTicketMessage): Promise<SupportTicketMessage>;
  updateSupportTicketMessage(id: number, message: Partial<InsertSupportTicketMessage>): Promise<SupportTicketMessage>;
  deleteSupportTicketMessage(id: number): Promise<void>;

  // Support Categories
  getSupportCategories(): Promise<SupportCategory[]>;
  getSupportCategory(id: number): Promise<SupportCategory | undefined>;
  createSupportCategory(category: InsertSupportCategory): Promise<SupportCategory>;
  updateSupportCategory(id: number, category: Partial<InsertSupportCategory>): Promise<SupportCategory>;
  deleteSupportCategory(id: number): Promise<void>;

  // Chatwoot Settings
  getChatwootSettings(): Promise<ChatwootSettings[]>;
  getChatwootSetting(id: number): Promise<ChatwootSettings | undefined>;
  createChatwootSettings(settings: InsertChatwootSettings): Promise<ChatwootSettings>;
  updateChatwootSettings(id: number, settings: Partial<InsertChatwootSettings>): Promise<ChatwootSettings>;
  deleteChatwootSettings(id: number): Promise<void>;

  // Email Accounts
  getEmailAccounts(): Promise<EmailAccount[]>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: number, account: Partial<InsertEmailAccount>): Promise<EmailAccount>;
  deleteEmailAccount(id: number): Promise<void>;
  setDefaultEmailAccount(id: number): Promise<EmailAccount>;

  // User Permissions
  getUserPermissions(): Promise<any[]>;
  getUserPermissionsByUserId(userId: number): Promise<any[]>;
  updateUserPermissions(userId: number, permissions: any[]): Promise<any[]>;

  // User Address
  getUserAddress(userId: number): Promise<UserAddress | null>;
  updateUserAddress(userId: number, address: Partial<InsertUserAddress>): Promise<UserAddress>;

  // Docker Containers
  getDockerContainers(): Promise<DockerContainer[]>;
  getDockerContainer(id: number): Promise<DockerContainer | undefined>;
  createDockerContainer(container: InsertDockerContainer): Promise<DockerContainer>;
  updateDockerContainer(id: number, container: Partial<InsertDockerContainer>): Promise<DockerContainer>;
  deleteDockerContainer(id: number): Promise<void>;
  updateContainerStatus(id: number, status: string): Promise<DockerContainer>;

  // Webhooks
  getWebhookConfigs(): Promise<WebhookConfig[]>;
  getWebhookConfig(id: number): Promise<WebhookConfig | undefined>;
  createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
  updateWebhookConfig(id: number, config: Partial<InsertWebhookConfig>): Promise<WebhookConfig>;
  deleteWebhookConfig(id: number): Promise<void>;
  updateWebhookTestResult(id: number, status: string): Promise<WebhookConfig>;

  // Task Scheduler
  getScheduledTasks(): Promise<any[]>;
  getScheduledTask(id: number): Promise<any | undefined>;
  createScheduledTask(task: any): Promise<any>;
  updateScheduledTask(id: number, task: any): Promise<any>;
  deleteScheduledTask(id: number): Promise<void>;

  // Task Execution Logs
  getTaskExecutionLogs(taskId: number, limit?: number): Promise<any[]>;
  getAllTaskExecutionLogs(limit?: number): Promise<any[]>;
  createTaskExecutionLog(log: any): Promise<any>;
  updateTaskExecutionLog(id: number, log: any): Promise<any>;
  deleteTaskExecutionLog(id: number): Promise<void>;
  clearTaskExecutionLogs(taskId: number): Promise<void>;

  // Task Templates
  getTaskTemplates(): Promise<any[]>;
  getTaskTemplate(id: number): Promise<any | undefined>;
  createTaskTemplate(template: any): Promise<any>;
  updateTaskTemplate(id: number, template: any): Promise<any>;
  deleteTaskTemplate(id: number): Promise<void>;

  // Expenses methods
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getExpenseStats(): Promise<any>;

  // Expense Categories methods
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategory(id: number): Promise<ExpenseCategory | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory>;
  deleteExpenseCategory(id: number): Promise<void>;

  // Payment Methods methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;

  // Expense Reminders methods
  getExpenseReminders(): Promise<ExpenseReminder[]>;
  getExpenseReminder(id: number): Promise<ExpenseReminder | undefined>;
  createExpenseReminder(reminder: InsertExpenseReminder): Promise<ExpenseReminder>;
  updateExpenseReminder(id: number, reminder: Partial<InsertExpenseReminder>): Promise<ExpenseReminder>;
  deleteExpenseReminder(id: number): Promise<void>;
  getActiveReminders(): Promise<ExpenseReminder[]>;

  // Exchange Rates methods
  getExchangeRates(): Promise<ExchangeRate[]>;
  getExchangeRate(fromCurrency: string, toCurrency?: string): Promise<ExchangeRate | undefined>;
  createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  updateExchangeRate(id: number, rate: Partial<InsertExchangeRate>): Promise<ExchangeRate>;
  deleteExchangeRate(id: number): Promise<void>;
  getLatestExchangeRate(fromCurrency: string, toCurrency?: string): Promise<ExchangeRate | undefined>;
  getExchangeRateHistory(fromCurrency: string, toCurrency?: string, days?: number): Promise<ExchangeRate[]>;
  updateExchangeRates(): Promise<void>;

  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: number): Promise<void>;

  // Plan Payment Discounts
  getPlanPaymentDiscounts(planId: number): Promise<PlanPaymentDiscount[]>;
  getPlanPaymentDiscount(id: number): Promise<PlanPaymentDiscount | undefined>;
  createPlanPaymentDiscount(discount: InsertPlanPaymentDiscount): Promise<PlanPaymentDiscount>;
  updatePlanPaymentDiscount(id: number, discount: Partial<InsertPlanPaymentDiscount>): Promise<PlanPaymentDiscount>;
  deletePlanPaymentDiscount(id: number): Promise<void>;

  // Plan Subscription Discounts
  getPlanSubscriptionDiscounts(planId: number): Promise<PlanSubscriptionDiscount[]>;
  getPlanSubscriptionDiscount(id: number): Promise<PlanSubscriptionDiscount | undefined>;
  createPlanSubscriptionDiscount(discount: InsertPlanSubscriptionDiscount): Promise<PlanSubscriptionDiscount>;
  updatePlanSubscriptionDiscount(id: number, discount: Partial<InsertPlanSubscriptionDiscount>): Promise<PlanSubscriptionDiscount>;
  deletePlanSubscriptionDiscount(id: number): Promise<void>;

  // Plan Resources
  getPlanResources(): Promise<PlanResource[]>;
  getPlanResource(id: number): Promise<PlanResource | undefined>;
  createPlanResource(resource: InsertPlanResource): Promise<PlanResource>;
  updatePlanResource(id: number, resource: Partial<InsertPlanResource>): Promise<PlanResource>;
  deletePlanResource(id: number): Promise<void>;

  // Plan Resource Assignments
  getPlanResourceAssignments(planId: number): Promise<PlanResourceAssignment[]>;
  getAllPlanResourceAssignments(): Promise<(PlanResourceAssignment & { resource: PlanResource })[]>;
  getPlanResourceAssignment(id: number): Promise<PlanResourceAssignment | undefined>;
  createPlanResourceAssignment(assignment: InsertPlanResourceAssignment): Promise<PlanResourceAssignment>;
  updatePlanResourceAssignment(id: number, assignment: Partial<InsertPlanResourceAssignment>): Promise<PlanResourceAssignment>;
  deletePlanResourceAssignment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // private sessions: Map<string, any> = new Map(); // Removed in-memory session management

  constructor() {
    this.init();
  }

  private async init() {
    await this.initializeData();
    await this.createAdminUser();
    await this.createDefaultNavigationItems();
    await this.updateNavigationForFirewall();
    await this.updateNavigationForDNS();
    await this.updateNavigationForNginxHosts();
    await this.updateNavigationForExpenses();
  }

  // Create default admin user if none exists
  async createAdminUser() {
    try {
      // Check if admin user exists
      const [existingAdmin] = await db.select()
        .from(users)
        .where(eq(users.username, 'admin'))
        .limit(1);

      if (existingAdmin) {
        console.log('Admin user exists, updating password to admin123');
        const hashedPassword = await argon2.hash('admin123');
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.username, 'admin'));
        console.log('Admin password updated successfully');
        return;
      }

      console.log('Creating new admin user...');
      const hashedPassword = await argon2.hash('admin123');
      console.log('Creating admin user with credentials: admin / admin123');

      const [adminUser] = await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'Admin',
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      }).returning();

      console.log('Admin user created successfully:', adminUser.username);

      // Create default permissions for admin user
      await this.createDefaultPermissionsForUser(adminUser);

      return adminUser;
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }

  // Create default navigation items
  async createDefaultNavigationItems() {
    try {
      const existingItems = await db.select().from(navigationItems).limit(1);
      if (existingItems.length > 0) {
        console.log('Navigation items already exist, skipping creation');
        return;
      }

      console.log('Creating default navigation items...');

      const defaultItems = [
        {
          label: 'Dashboard',
          href: '/',
          icon: 'LayoutDashboard',
          position: 1,
          parentId: null
        },
        {
          label: 'Clientes',
          href: '/clients',
          icon: 'Users',
          position: 2,
          parentId: null
        },
        {
          label: 'Produtos',
          href: '/products',
          icon: 'Package',
          position: 3,
          parentId: null
        },
        {
          label: 'Fornecedores',
          href: '/suppliers',
          icon: 'Truck',
          position: 4,
          parentId: null
        },
        {
          label: 'Vendas',
          href: '/sales',
          icon: 'ShoppingCart',
          position: 5,
          parentId: null
        },
        {
          label: 'Suporte',
          href: '/support',
          icon: 'MessageSquare',
          position: 6,
          parentId: null
        },
        {
          label: 'Email',
          href: '/email-accounts',
          icon: 'Mail',
          position: 7,
          parentId: null
        },
        {
          label: 'Firewall',
          href: '/firewall',
          icon: 'Shield',
          position: 8,
          parentId: null
        },
        {
          label: 'Banco de Dados',
          href: '/database-admin',
          icon: 'Database',
          position: 9,
          parentId: null
        },
        {
          label: 'Docker Containers',
          href: '/docker-containers',
          icon: 'Container',
          position: 10,
          parentId: null
        },
        {
          label: 'Hosts Nginx',
          href: '/nginx-hosts',
          icon: 'Server',
          position: 11,
          parentId: null
        }
      ];

      const insertedItems = await db.insert(navigationItems).values(defaultItems).returning();

      // No longer need sub-items as they are now at root level

      console.log('Default navigation items created successfully');
    } catch (error) {
      console.error('Error creating default navigation items:', error);
    }
  }

  // Update navigation to add firewall and remove user permissions
  async updateNavigationForFirewall() {
    try {
      const items = await this.getNavigationItems();

      // Remove user permissions item if it exists
      const permissionsItem = items.find(item => item.href === '/user-permissions');
      if (permissionsItem) {
        await this.deleteNavigationItem(permissionsItem.id);
        console.log('Removed user permissions navigation item');
      }

      // Add firewall item if it doesn't exist
      const firewallExists = items.some(item => item.href === '/firewall');
      if (!firewallExists) {
        await this.createNavigationItem({
          label: 'Firewall',
          href: '/firewall',
          icon: 'Shield',
          order: 8,
          parentId: null
        });
        console.log('Added firewall navigation item');
      }
    } catch (error) {
      console.error('Error updating navigation for firewall:', error);
    }
  }

  // Update navigation to add DNS management
  async updateNavigationForDNS() {
    try {
      const items = await this.getNavigationItems();

      // Add DNS item if it doesn't exist
      const dnsExists = items.some(item => item.href === '/dns');
      if (!dnsExists) {
        await this.createNavigationItem({
          label: 'DNS',
          href: '/dns',
          icon: 'Globe',
          order: 10,
          parentId: null
        });
        console.log('Added DNS navigation item');
      }
    } catch (error) {
      console.error('Error updating navigation for DNS:', error);
    }
  }

  // Update navigation to add Nginx Hosts management
  async updateNavigationForNginxHosts() {
    try {
      const items = await this.getNavigationItems();

      // Add Nginx Hosts item if it doesn't exist
      const nginxExists = items.some(item => item.href === '/nginx-hosts');
      if (!nginxExists) {
        await this.createNavigationItem({
          label: 'Nginx Hosts',
          href: '/nginx-hosts',
          icon: 'Server',
          order: 11,
          parentId: null
        });
        console.log('Added Nginx Hosts navigation item');
      }
    } catch (error) {
      console.error('Error updating navigation for Nginx Hosts:', error);
    }
  }

  private async initializeData() {
    // Database initialization - all data is now stored in PostgreSQL
    try {
      const existingUsers = await db.select().from(users).limit(1);
      const existingSuppliers = await db.select().from(suppliers).limit(1);
      const existingSales = await db.select().from(sales).limit(1);

      if (existingUsers.length === 0 || existingSuppliers.length === 0 || existingSales.length === 0) {
        console.log("Creating missing sample data...");
        await this.createSampleData();
        console.log("Database initialized with sample data");
      } else {
        console.log("Database already populated");
        // Initialize permissions for existing users if not present
        await this.initializePermissions();
      }
    } catch (error) {
      console.log("Database connection pending...");
    }
  }

  private async initializePermissions() {
    try {
      // Check if permissions are already initialized
      if (!(global as any).userPermissions || (global as any).userPermissions.length === 0) {
        const [adminUser] = await db.select().from(users).where(eq(users.username, "admin"));
        if (adminUser) {
          this.createDefaultPermissionsForUser(adminUser);
        }
      }
    } catch (error) {
      console.log("Error initializing permissions:", error);
    }
  }

  private async createSampleData() {
    const now = new Date().toISOString();

    // Fetch admin user to use their ID for permissions and other associations
    const [adminUser] = await db.select().from(users).where(eq(users.username, "admin")).limit(1);

    // Create sample categories
    const categoriesData = [
      {
        name: "Eletrônicos",
        description: "Produtos eletrônicos em geral",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Móveis",
        description: "Móveis para casa e escritório",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Roupas",
        description: "Vestuário em geral",
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.insert(categories).values(categoriesData);

    // Create sample manufacturers
    const manufacturersData = [
      {
        name: "TechCorp",
        description: "Fabricante de eletrônicos",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "MobileFlex",
        description: "Fabricante de móveis",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Fashion Brand",
        description: "Marca de roupas",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "WearTech",
        description: "Tecnologia vestível",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "GameGear",
        description: "Equipamentos para jogos",
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.insert(manufacturers).values(manufacturersData);

    // Create sample product groups
    const productGroupsData = [
      {
        name: "Smartphones",
        description: "Telefones inteligentes",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Camisetas",
        description: "Camisetas diversas",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Laptops",
        description: "Computadores portáteis",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Cadeiras",
        description: "Cadeiras de escritório",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Monitores",
        description: "Monitores de computador",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Mesas",
        description: "Mesas de escritório",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Wearables",
        description: "Dispositivos vestíveis",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Calças",
        description: "Calças diversas",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Periféricos",
        description: "Periféricos de computador",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Estantes",
        description: "Estantes e prateleiras",
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.insert(productGroups).values(productGroupsData);

    // Create sample user
    const [user] = await db.insert(users).values({
      username: "john.smith",
      password: await argon2.hash("password123"),
      name: "John Smith",
      role: "Admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    }).returning();

    // Create sample clients
    const clientsData = [
      {
        name: "Ana Silva",
        email: "ana.silva@techsolutions.com.br",
        phone: "(11) 99999-1111",
        company: "Tech Solutions Brasil",
        position: "Diretora de TI",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Cliente estratégico para soluções empresariais",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Carlos Mendes",
        email: "carlos@marketingdigital.com",
        phone: "(21) 88888-2222",
        company: "Marketing Digital Pro",
        position: "CEO",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Interessado em automação de marketing",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Fernanda Costa",
        email: "fernanda@consultoriaempresarial.com",
        phone: "(31) 77777-3333",
        company: "Consultoria Empresarial",
        position: "Sócia-Fundadora",
        image: null,
        status: "inactive",
        notes: "Contrato finalizado no último trimestre",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Roberto Santos",
        email: "roberto@inovacorp.com.br",
        phone: "(41) 66666-4444",
        company: "Inovação Corp",
        position: "Diretor de Inovação",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Focado em transformação digital",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Juliana Oliveira",
        email: "juliana@designstudio.com.br",
        phone: "(51) 55555-5555",
        company: "Design Studio Creative",
        position: "Diretora Criativa",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Especialista em UX/UI para aplicações móveis",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Pedro Almeida",
        email: "pedro@financorp.com.br",
        phone: "(61) 44444-6666",
        company: "FinanCorp Solutions",
        position: "Gerente de Projetos",
        image: null,
        status: "pending",
        notes: "Aguardando aprovação da proposta",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Marina Rodriguez",
        email: "marina@healthtech.com.br",
        phone: "(71) 33333-7777",
        company: "HealthTech Solutions",
        position: "CTO",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Desenvolve soluções para área da saúde",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Lucas Ferreira",
        email: "lucas@educatech.com.br",
        phone: "(81) 22222-8888",
        company: "EducaTech Brasil",
        position: "Diretor de Produto",
        image: null,
        status: "inactive",
        notes: "Projeto finalizado, possível renovação",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Camila Barbosa",
        email: "camila@greenenergy.com.br",
        phone: "(85) 11111-9999",
        company: "Green Energy Solutions",
        position: "Coordenadora de Sustentabilidade",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        status: "active",
        notes: "Foco em tecnologias sustentáveis",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Rafael Lima",
        email: "rafael@smartlogistics.com.br",
        phone: "(48) 99999-0000",
        company: "Smart Logistics",
        position: "Gerente de Operações",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        status: "pending",
        notes: "Interessado em otimização de rotas",
        createdAt: now,
        updatedAt: now
      }
    ];

    const [client1, client2, client3] = await db.insert(clients).values(clientsData).returning();

    // Create support categories
    const supportCategoriesData = [
      { name: "Técnico", description: "Problemas técnicos e bugs", color: "#ef4444", isActive: true, sortOrder: 1 },
      { name: "Financeiro", description: "Questões de cobrança e pagamento", color: "#f59e0b", isActive: true, sortOrder: 2 },
      { name: "Geral", description: "Dúvidas gerais e informações", color: "#3b82f6", isActive: true, sortOrder: 3 },
      { name: "Nova Funcionalidade", description: "Solicitações de recursos", color: "#10b981", isActive: true, sortOrder: 4 }
    ];

    await db.insert(supportCategories).values(supportCategoriesData);

    // Create sample support tickets
    const ticketsData = [
      {
        ticketNumber: "TCK-001",
        clientId: client1.id,
        userId: user.id,
        title: "Problema no login da aplicação",
        description: "Não consigo fazer login na aplicação. Aparece uma mensagem de erro dizendo que as credenciais são inválidas, mesmo usando as informações corretas.",
        status: "open",
        priority: "high",
        category: "Técnico",
        tags: ["login", "autenticação", "erro"],
        assignedTo: user.id,
        chatwootConversationId: 12345,
        chatwootInboxId: 1,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      },
      {
        ticketNumber: "TCK-002",
        clientId: client2.id,
        userId: user.id,
        title: "Solicitação de nova funcionalidade",
        description: "Gostaria de solicitar a implementação de relatórios personalizados na aplicação. Seria muito útil poder gerar relatórios com filtros específicos.",
        status: "in-progress",
        priority: "medium",
        category: "Nova Funcionalidade",
        tags: ["relatórios", "funcionalidade", "personalização"],
        assignedTo: user.id,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      },
      {
        ticketNumber: "TCK-003",
        clientId: client3.id,
        userId: user.id,
        title: "Dúvida sobre cobrança",
        description: "Recebi uma cobrança que não entendo. Gostaria de esclarecimentos sobre os valores cobrados no último mês.",
        status: "pending",
        priority: "low",
        category: "Financeiro",
        tags: ["cobrança", "faturamento", "dúvida"],
        assignedTo: user.id,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      },
      {
        ticketNumber: "TCK-004",
        clientId: null,
        userId: user.id,
        title: "Lentidão na aplicação",
        description: "A aplicação está muito lenta para carregar as páginas. Especialmente na seção de relatórios, que demora mais de 30 segundos para abrir.",
        status: "resolved",
        priority: "urgent",
        category: "Técnico",
        tags: ["performance", "lentidão", "relatórios"],
        assignedTo: user.id,
        resolvedAt: now,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      },
      {
        ticketNumber: "TCK-005",
        clientId: client1.id,
        userId: user.id,
        title: "Treinamento para novos usuários",
        description: "Precisamos de treinamento para 5 novos usuários que foram contratados. Gostaria de agendar uma sessão de treinamento.",
        status: "closed",
        priority: "medium",
        category: "Geral",
        tags: ["treinamento", "usuários", "agendamento"],
        assignedTo: user.id,
        resolvedAt: now,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      }
    ];

    const [ticket1, ticket2, ticket3] = await db.insert(supportTickets).values(ticketsData).returning();

    // Create sample ticket messages
    const messagesData = [
      {
        ticketId: ticket1.id,
        userId: user.id,
        message: "Olá! Obrigado por reportar este problema. Estou investigando a questão do login e em breve terei uma resposta.",
        messageType: "message",
        isInternal: false,
        attachments: [],
        chatwootMessageId: 98765,
        createdAt: now
      },
      {
        ticketId: ticket1.id,
        userId: user.id,
        message: "Verificamos que há um problema no servidor de autenticação. Estamos trabalhando na correção.",
        messageType: "note",
        isInternal: true,
        attachments: [],
        createdAt: now
      },
      {
        ticketId: ticket2.id,
        userId: user.id,
        message: "Sua solicitação foi recebida e está sendo analisada pela equipe de desenvolvimento. Estimamos 2-3 semanas para implementação.",
        messageType: "message",
        isInternal: false,
        attachments: [],
        createdAt: now
      }
    ];

    await db.insert(supportTicketMessages).values(messagesData);

    // Create Chatwoot settings example
    const chatwootSettingsData = {
      accountId: 1,
      inboxId: 1,
      inboxName: "Suporte Principal",
      apiToken: "chatwoot_api_token_example",
      webhookUrl: "https://example.com/webhook/chatwoot",
      isActive: true,
      syncEnabled: true,
      createdAt: now,
      updatedAt: now
    };

    await db.insert(chatwootSettings).values(chatwootSettingsData);

    // Create navigation items
    const navItems = [
      { label: "Dashboard", icon: "LayoutDashboard", href: "/", order: 1, parentId: null },
      { label: "Clientes", icon: "Users", href: "/clients", order: 2, parentId: null },
      { label: "Produtos", icon: "Package", href: "/products", order: 3, parentId: null },
      { label: "Fornecedores", icon: "Truck", href: "/suppliers", order: 4, parentId: null },
      { label: "Vendas", icon: "ShoppingCart", href: "/sales", order: 5, parentId: null },
      { label: "Suporte", icon: "MessageSquare", href: "/support", order: 6, parentId: null },
      { label: "Contas de Email", icon: "Mail", href: "/email-accounts", order: 7, parentId: null },
      { label: "Admin DB", icon: "Database", href: "/database-admin", order: 8, parentId: null },
      { label: "Firewall", icon: "Shield", href: "/firewall", order: 9, parentId: null },
      { label: "DNS", icon: "Globe", href: "/dns", order: 10, parentId: null },
      { label: "Perfil", icon: "User", href: "/user-profile", order: 11, parentId: null },
      { label: "Ajuda", icon: "HelpCircle", href: "/help", order: 12, parentId: null },
      { label: "Containers Docker", icon: "Container", href: "/containers", order: 13, parentId: null }
    ];

    await db.insert(navigationItems).values(navItems);

    // Sample docker containers
    const sampleContainers = [
      {
        name: "NGINX Web Server",
        image: "nginx",
        tag: "alpine",
        description: "Servidor web NGINX para hospedar aplicações estáticas",
        status: "stopped",
        networkMode: "bridge",
        restartPolicy: "unless-stopped",
        cpuLimit: "0.5",
        memoryLimit: "256m",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nginx_logo.svg/2560px-Nginx_logo.svg.png",
        environment: JSON.stringify({
          "NGINX_HOST": "localhost",
          "NGINX_PORT": "80"
        }),
        volumes: JSON.stringify([
          { host: "/var/www/html", container: "/usr/share/nginx/html" }
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "PostgreSQL Database",
        image: "postgres",
        tag: "15-alpine",
        description: "Banco de dados PostgreSQL para aplicações web",
        status: "stopped",
        networkMode: "bridge",
        restartPolicy: "unless-stopped",
        cpuLimit: "1.0",
        memoryLimit: "512m",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Postgresql_elephant.svg/1985px-Postgresql_elephant.svg.png",
        environment: JSON.stringify({
          "POSTGRES_DB": "myapp",
          "POSTGRES_USER": "admin",
          "POSTGRES_PASSWORD": "secret123"
        }),
        volumes: JSON.stringify([
          { host: "/var/lib/postgresql/data", container: "/var/lib/postgresql/data" }
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(dockerContainers).values(sampleContainers);

    // Create sample suppliers
    const suppliersData = [
      {
        name: "Distribuidora Tech Solutions",
        companyName: "Tech Solutions LTDA",
        email: "vendas@techsolutions.com.br",
        phone: "(11) 3456-7890",
        whatsapp: "(11) 99876-5432",
        website: "https://www.techsolutions.com.br",
        cnpj: "12.345.678/0001-90",
        address: "Rua das Tecnologias, 123 - Vila Digital",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        country: "Brasil",
        contactPerson: "João Silva",
        contactRole: "Gerente Comercial",
        paymentTerms: "30 dias",
        deliveryTime: "5-7 dias úteis",
        minimumOrder: "R$ 2.000,00",
        categories: ["1", "2"], // Eletrônicos, Móveis
        manufacturers: ["1", "2"], // TechCorp, MobileFlex
        productGroups: ["1", "2"], // Smartphones, Camisetas
        notes: "Fornecedor confiável com ótimos prazos de entrega",
        status: "active",
        rating: 5,
        image: "/uploads/tech-solutions-logo.png",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Global Electronics Distribuição",
        companyName: "Global Electronics S.A.",
        email: "contato@globalelectronics.com.br",
        phone: "(21) 2345-6789",
        whatsapp: "(21) 98765-4321",
        website: "https://www.globalelectronics.com.br",
        cnpj: "23.456.789/0001-01",
        address: "Av. Industrial, 456 - Zona Sul",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "20000-000",
        country: "Brasil",
        contactPerson: "Maria Santos",
        contactRole: "Diretora de Vendas",
        paymentTerms: "45 dias",
        deliveryTime: "3-5 dias úteis",
        minimumOrder: "R$ 5.000,00",
        categories: ["1"], // Eletrônicos
        manufacturers: ["1"], // TechCorp
        productGroups: ["1"], // Smartphones
        notes: "Especializada em eletrônicos importados",
        status: "active",
        rating: 4,
        image: "/uploads/global-electronics-logo.png",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Móveis & Design",
        companyName: "Móveis & Design LTDA",
        email: "vendas@moveisedesign.com.br",
        phone: "(31) 3456-7890",
        whatsapp: "(31) 97654-3210",
        website: "https://www.moveisedesign.com.br",
        cnpj: "34.567.890/0001-12",
        address: "Rua dos Móveis, 789 - Centro",
        city: "Belo Horizonte",
        state: "MG",
        zipCode: "30000-000",
        country: "Brasil",
        contactPerson: "Carlos Oliveira",
        contactRole: "Supervisor de Vendas",
        paymentTerms: "60 dias",
        deliveryTime: "10-15 dias úteis",
        minimumOrder: "R$ 3.000,00",
        categories: ["2"], // Móveis
        manufacturers: ["2"], // MobileFlex
        productGroups: [],
        notes: "Móveis corporativos e residenciais de alta qualidade",
        status: "active",
        rating: 5,
        image: "/uploads/moveis-design-logo.png",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Fashion Distribuidora",
        companyName: "Fashion Dist. e Com. LTDA",
        email: "pedidos@fashiondist.com.br",
        phone: "(41) 2345-6789",
        whatsapp: "(41) 96543-2109",
        website: "https://www.fashiondist.com.br",
        cnpj: "45.678.901/0001-23",
        address: "Rua da Moda, 321 - Bairro Fashion",
        city: "Curitiba",
        state: "PR",
        zipCode: "80000-000",
        country: "Brasil",
        contactPerson: "Ana Costa",
        contactRole: "Gerente de Contas",
        paymentTerms: "28 dias",
        deliveryTime: "7-10 dias úteis",
        minimumOrder: "R$ 1.500,00",
        categories: ["3"], // Roupas
        manufacturers: [],
        productGroups: ["2"], // Camisetas
        notes: "Especializada em moda feminina e masculina",
        status: "active",
        rating: 4,
        image: "/uploads/fashion-dist-logo.png",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Mega Suprimentos",
        companyName: "Mega Suprimentos Industriais LTDA",
        email: "vendas@megasuprimentos.com.br",
        phone: "(51) 3456-7890",
        whatsapp: "(51) 95432-1098",
        website: "https://www.megasuprimentos.com.br",
        cnpj: "56.789.012/0001-34",
        address: "Av. Industrial, 1000 - Distrito Industrial",
        city: "Porto Alegre",
        state: "RS",
        zipCode: "90000-000",
        country: "Brasil",
        contactPerson: "Roberto Silva",
        contactRole: "Diretor Comercial",
        paymentTerms: "90 dias",
        deliveryTime: "15-20 dias úteis",
        minimumOrder: "R$ 10.000,00",
        categories: ["1", "2"], // Eletrônicos, Móveis
        manufacturers: ["1", "2"], // TechCorp, MobileFlex
        productGroups: ["1"],
        notes: "Fornecedor de grande porte para projetos industriais",
        status: "active",
        rating: 3,
        image: "/uploads/mega-suprimentos-logo.png",
        createdAt: now,
        updatedAt: now
      }
    ];

    await db.insert(suppliers).values(suppliersData);

    // Create sample products
    const productsData = [
      {
        name: "Smartphone X",
        description: "Último lançamento com câmera de alta resolução e processador rápido.",
        price: "3500.00",
        stockQuantity: 50,
        categoryId: 1, // Eletrônicos
        manufacturerId: 1, // TechCorp
        productGroupId: 1, // Smartphones
        sku: "SPX-TC-001",
        imageUrl: "https://images.unsplash.com/photo-1585109000021-781262a127f3?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Laptop Ultrabook Z",
        description: "Leve e potente, ideal para profissionais que precisam de mobilidade.",
        price: "7200.00",
        stockQuantity: 30,
        categoryId: 1, // Eletrônicos
        manufacturerId: 1, // TechCorp
        productGroupId: 3, // Laptops
        sku: "ULZ-TC-002",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Cadeira Ergonômica Conforto",
        description: "Design ergonômico para máximo conforto durante longas horas de trabalho.",
        price: "850.00",
        stockQuantity: 100,
        categoryId: 2, // Móveis
        manufacturerId: 2, // MobileFlex
        productGroupId: 4, // Cadeiras
        sku: "CEC-MF-003",
        imageUrl: "https://images.unsplash.com/photo-1555040758-45827510971b?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Camiseta Algodão Premium",
        description: "Malha 100% algodão, toque macio e caimento perfeito.",
        price: "79.90",
        stockQuantity: 200,
        categoryId: 3, // Roupas
        manufacturerId: 3, // Fashion Brand
        productGroupId: 2, // Camisetas
        sku: "CAP-FB-004",
        imageUrl: "https://images.unsplash.com/photo-1564529075151-c3b5748c558c?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Monitor Ultrawide 34''",
        description: "Experiência imersiva com alta taxa de atualização e cores vibrantes.",
        price: "4800.00",
        stockQuantity: 25,
        categoryId: 1, // Eletrônicos
        manufacturerId: 1, // TechCorp
        productGroupId: 5, // Monitores
        sku: "MUW-TC-005",
        imageUrl: "https://images.unsplash.com/photo-1606394739880-56064031a0b2?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Mesa de Escritório Moderna",
        description: "Design clean e funcional, com espaço para organizar seus equipamentos.",
        price: "1500.00",
        stockQuantity: 40,
        categoryId: 2, // Móveis
        manufacturerId: 2, // MobileFlex
        productGroupId: 6, // Mesas
        sku: "MEM-MF-006",
        imageUrl: "https://images.unsplash.com/photo-1580522172926-1271e217904e?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Smartwatch Fitness Tracker",
        description: "Monitore sua saúde e atividades físicas com este smartwatch completo.",
        price: "1200.00",
        stockQuantity: 75,
        categoryId: 1, // Eletrônicos
        manufacturerId: 4, // WearTech
        productGroupId: 7, // Wearables
        sku: "SFT-WT-007",
        imageUrl: "https://images.unsplash.com/photo-1546868871-707f84b8462c?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Calça Jeans Slim Fit",
        description: "Jeans de alta qualidade com corte moderno e confortável.",
        price: "189.90",
        stockQuantity: 150,
        categoryId: 3, // Roupas
        manufacturerId: 3, // Fashion Brand
        productGroupId: 8, // Calças
        sku: "CJS-FB-008",
        imageUrl: "https://images.unsplash.com/photo-1591076604308-77671226056f?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Teclado Mecânico Gamer RGB",
        description: "Teclado com switches mecânicos de alta performance e iluminação RGB personalizável.",
        price: "450.00",
        stockQuantity: 60,
        categoryId: 1, // Eletrônicos
        manufacturerId: 5, // GameGear
        productGroupId: 9, // Periféricos
        sku: "TMG-GG-009",
        imageUrl: "https://images.unsplash.com/photo-1604887795504-053a221f7814?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Estante Modular Decorativa",
        description: "Estante versátil para organizar livros e objetos de decoração.",
        price: "950.00",
        stockQuantity: 80,
        categoryId: 2, // Móveis
        manufacturerId: 2, // MobileFlex
        productGroupId: 7, // Estantes
        sku: "EMD-MF-010",
        imageUrl: "https://images.unsplash.com/photo-1618172198085-41a450b77097?w=200&h=200&fit=crop&crop=face",
        createdAt: now,
        updatedAt: now
      }
    ];

    const [
      smartphone,
      laptop,
      chair,
      tshirt,
      monitor,
      desk,
      smartwatch,
      jeans,
      keyboard,
      shelf
    ] = await db.insert(products).values(productsData).returning();


    // Create sample sales
    const salesData = [
      {
        saleNumber: "VDA-001",
        clientId: client1.id,
        userId: user.id,
        saleDate: "2024-01-15",
        status: "entregue",
        paymentMethod: "cartao",
        paymentStatus: "pago",
        subtotal: "1299.90",
        discount: "50.00",
        tax: "0.00",
        shipping: "29.90",
        total: "1279.80",
        notes: "Primeira compra do cliente - desconto especial aplicado",
        deliveryAddress: "Rua das Flores, 123 - São Paulo, SP",
        deliveryDate: "2024-01-20",
        createdAt: now,
        updatedAt: now
      },
      {
        saleNumber: "VDA-002",
        clientId: client2.id,
        userId: user.id,
        saleDate: "2024-01-18",
        status: "enviada",
        paymentMethod: "pix",
        paymentStatus: "pago",
        subtotal: "799.80",
        discount: "0.00",
        tax: "15.99",
        shipping: "49.90",
        total: "865.69",
        notes: "Entrega expressa solicitada",
        deliveryAddress: "Av. Principal, 456 - Rio de Janeiro, RJ",
        deliveryDate: "2024-01-25",
        createdAt: now,
        updatedAt: now
      },
      {
        saleNumber: "VDA-003",
        clientId: client3.id,
        userId: user.id,
        saleDate: "2024-01-20",
        status: "confirmada",
        paymentMethod: "boleto",
        paymentStatus: "pendente",
        subtotal: "2499.75",
        discount: "100.00",
        tax: "49.99",
        shipping: "99.90",
        total: "2549.64",
        notes: "Aguardando confirmação do pagamento via boleto",
        deliveryAddress: "Rua Comercial, 789 - Belo Horizonte, MG",
        deliveryDate: "2024-02-01",
        createdAt: now,
        updatedAt: now
      },
      {
        saleNumber: "VDA-004",
        clientId: client1.id,
        userId: user.id,
        saleDate: "2024-01-22",
        status: "pendente",
        paymentMethod: "credito",
        paymentStatus: "pendente",
        subtotal: "3299.85",
        discount: "200.00",
        tax: "65.99",
        shipping: "79.90",
        total: "3245.74",
        notes: "Venda parcelada em 12x - análise de crédito aprovada",
        deliveryAddress: "Rua das Flores, 123 - São Paulo, SP",
        deliveryDate: "2024-02-05",
        createdAt: now,
        updatedAt: now
      },
      {
        saleNumber: "VDA-005",
        clientId: client2.id,
        userId: user.id,
        saleDate: "2024-01-25",
        status: "entregue",
        paymentMethod: "dinheiro",
        paymentStatus: "pago",
        subtotal: "599.90",
        discount: "0.00",
        tax: "0.00",
        shipping: "0.00",
        total: "599.90",
        notes: "Retirada no balcão - pagamento à vista",
        deliveryAddress: null,
        deliveryDate: null,
        createdAt: now,
        updatedAt: now
      },
      {
        saleNumber: "VDA-006",
        clientId: client3.id,
        userId: user.id,
        saleDate: "2024-01-28",
        status: "cancelada",
        paymentMethod: "pix",
        paymentStatus: "cancelado",
        subtotal: "1899.80",
        discount: "0.00",
        tax: "37.99",
        shipping: "59.90",
        total: "1997.69",
        notes: "Produto fora de estoque - venda cancelada e valor estornado",
        deliveryAddress: "Rua Comercial, 789 - Belo Horizonte, MG",
        deliveryDate: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    const [sale1, sale2, sale3, sale4, sale5, sale6] = await db.insert(sales).values(salesData).returning();

    // Create sample sale items
    const saleItemsData = [
      // Sale 1 items
      {
        saleId: sale1.id,
        productId: smartphone.id,
        quantity: 1,
        unitPrice: "1299.90",
        discount: "50.00",
        total: "1249.90",
        createdAt: now
      },
      // Sale 2 items  
      {
        saleId: sale2.id,
        productId: chair.id,
        quantity: 1,
        unitPrice: "799.80",
        discount: "0.00",
        total: "799.80",
        createdAt: now
      },
      // Sale 3 items
      {
        saleId: sale3.id,
        productId: laptop.id,
        quantity: 1,
        unitPrice: "2499.75",
        discount: "100.00",
        total: "2399.75",
        createdAt: now
      },
      // Sale 4 items - Multiple products
      {
        saleId: sale4.id,
        productId: smartphone.id,
        quantity: 2,
        unitPrice: "1299.90",
        discount: "100.00",
        total: "2499.80",
        createdAt: now
      },
      {
        saleId: sale4.id,
        productId: chair.id,
        quantity: 1,
        unitPrice: "799.80",
        discount: "100.00",
        total: "699.80",
        createdAt: now
      },
      // Sale 5 items
      {
        saleId: sale5.id,
        productId: tshirt.id,
        quantity: 3,
        unitPrice: "199.90",
        discount: "0.00",
        total: "599.70",
        createdAt: now
      },
      // Sale 6 items (cancelled)
      {
        saleId: sale6.id,
        productId: laptop.id,
        quantity: 1,
        unitPrice: "1899.80",
        discount: "0.00",
        total: "1899.80",
        createdAt: now
      }
    ];

    await db.insert(saleItems).values(saleItemsData);
  }

  private createDefaultPermissionsForUser(user: any) {
    // Create default user permissions for admin user based on CRUD operations per page
    const permissionsData = [
      // Dashboard - Visualização de estatísticas e métricas
      { userId: user.id, module: "dashboard", canView: true, canCreate: false, canEdit: false, canDelete: false },

      // Clientes - CRUD completo
      { userId: user.id, module: "clients", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Produtos - CRUD completo
      { userId: user.id, module: "products", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Categorias - CRUD completo (sub-módulo de produtos)
      { userId: user.id, module: "categories", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Fabricantes - CRUD completo (sub-módulo de produtos)
      { userId: user.id, module: "manufacturers", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Grupos de Produtos - CRUD completo (sub-módulo de produtos)
      { userId: user.id, module: "product_groups", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Fornecedores - CRUD completo
      { userId: user.id, module: "suppliers", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Vendas - CRUD completo
      { userId: user.id, module: "sales", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Itens de Venda - CRUD completo (sub-módulo de vendas)
      { userId: user.id, module: "sale_items", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Cupons Fiscais - Geração e download
      { userId: user.id, module: "receipts", canView: true, canCreate: true, canEdit: false, canDelete: false },

      // Suporte - CRUD completo
      { userId: user.id, module: "support", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Tickets de Suporte - CRUD completo (sub-módulo de suporte)
      { userId: user.id, module: "support_tickets", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Mensagens de Suporte - CRUD completo (sub-módulo de suporte)
      { userId: user.id, module: "support_messages", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Categorias de Suporte - CRUD completo (sub-módulo de suporte)
      { userId: user.id, module: "support_categories", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Configurações Chatwoot - CRUD completo (sub-módulo de suporte)
      { userId: user.id, module: "chatwoot_settings", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Contas de Email - CRUD completo
      { userId: user.id, module: "email_accounts", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Configuração de Email Padrão - Apenas edição
      { userId: user.id, module: "email_default", canView: true, canCreate: false, canEdit: true, canDelete: false },

      // Administração do Banco de Dados - CRUD completo
      { userId: user.id, module: "database_admin", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Usuários - CRUD completo (sub-módulo de admin)
      { userId: user.id, module: "users", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Permissões de Usuários - Visualização e edição
      { userId: user.id, module: "user_permissions", canView: true, canCreate: false, canEdit: true, canDelete: false },

      // Perfil do Usuário - Visualização e edição própria
      { userId: user.id, module: "user_profile", canView: true, canCreate: false, canEdit: true, canDelete: false },

      // Endereço do Usuário - Visualização e edição própria
      { userId: user.id, module: "user_address", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Carrinho de Compras - CRUD completo
      { userId: user.id, module: "cart", canView: true, canCreate: true, canEdit: true, canDelete: true },

      // Notificações - Visualização, marcação como lida e exclusão
      { userId: user.id, module: "notifications", canView: true, canCreate: false, canEdit: true, canDelete: true },

      // Emails - Visualização, marcação como lida e exclusão
      { userId: user.id, module: "emails", canView: true, canCreate: false, canEdit: true, canDelete: true },

      // Navegação - Apenas visualização
      { userId: user.id, module: "navigation", canView: true, canCreate: false, canEdit: false, canDelete: false },

      // Sistema/Ajuda - Apenas visualização
      { userId: user.id, module: "help", canView: true, canCreate: false, canEdit: false, canDelete: false },

      // Monitoramento do Sistema - Apenas visualização
      { userId: user.id, module: "system_monitoring", canView: true, canCreate: false, canEdit: false, canDelete: false }
    ];

    // Store permissions in memory, assuming this is a temporary solution until schema update
    (global as any).userPermissions = permissionsData;
  }

  // Authentication methods
  async authenticateUser(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<{ user: User; sessionToken: string; refreshToken: string } | null> {
    try {
      console.log('Authenticating user with Argon2 verification:', username);

      const [user] = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) {
        console.log('User not found:', username);
        return null;
      }

      // Debug: print username and password hash
      console.log('Auth debug:', { username, dbPassword: user.password, inputPassword: password });

      // Verify password using Argon2
      let isValid = false;
      try {
        isValid = await argon2.verify(user.password, password);
        console.log('Argon2 verification result:', isValid);
      } catch (err) {
        console.error('Argon2 verification error:', err);
      }
      if (!isValid) {
        console.log('Invalid password for user:', username);
        return null;
      }

      // Remove any existing sessions for this user to prevent multiple sessions
      try {
        await db.delete(sessions).where(eq(sessions.userId, user.id));
      } catch (error) {
        console.log('Error cleaning up old sessions:', error);
      }

      // Generate secure random tokens
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');

      // Don't hash session token - store it directly for cookie comparison
      // const sessionHash = await argon2.hash(sessionToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours

      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

      try {
        await db.insert(sessions).values({
          userId: user.id,
          token: sessionToken, // Store original token, not hash
          expiresAt: expiresAt,
          refreshExpiresAt: refreshExpiresAt,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown'
        });
      } catch (error) {
        console.log('Error inserting session, using in-memory fallback:', error);
        // Fallback to in-memory session storage
        (global as any).activeSessions = (global as any).activeSessions || new Map();
        (global as any).activeSessions.set(sessionToken, {
          userId: user.id,
          expiresAt: expiresAt,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown'
        });
      }

      console.log('Secure session created successfully for user:', username);

      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          password: user.password
        },
        sessionToken: sessionToken,
        refreshToken: refreshToken
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  async validateSession(sessionToken: string, ipAddress?: string): Promise<{ user: any } | null> {
    try {
      console.log(`[Session Validation] Starting validation for token: ${sessionToken.substring(0, 10)}...`);

      // Try database sessions first
      try {
        const activeSessions = await db.select({
          id: sessions.id,
          userId: sessions.userId,
          token: sessions.token,
          expiresAt: sessions.expiresAt,
          ipAddress: sessions.ipAddress,
          userAgent: sessions.userAgent
        })
          .from(sessions)
          .where(sql`${sessions.expiresAt} > NOW()`);

        console.log(`[Session Validation] Found ${activeSessions.length} active sessions in database`);

        // Find matching session by direct token comparison (tokens are stored in plain text now)
        const matchingSession = activeSessions.find(session => session.token === sessionToken);

        if (matchingSession) {
          console.log(`[Session Validation] Session found and valid for user: ${matchingSession.userId}`);

          // Get user information
          const [user] = await db.select()
            .from(users)
            .where(eq(users.id, matchingSession.userId))
            .limit(1);

          if (!user) {
            console.log(`[Session Validation] User not found for session userId: ${matchingSession.userId}`);
            return null;
          }

          console.log(`[Session Validation] Success - User found: ${user.username}`);
          return {
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
              avatar: user.avatar
            }
          };
        } else {
          console.log(`[Session Validation] No matching session found in database`);
        }
      } catch (error) {
        console.log('Database session validation failed, trying in-memory fallback:', error);
      }

      // Fallback to in-memory sessions
      const activeSessions = (global as any).activeSessions || new Map();
      const session = activeSessions.get(sessionToken);

      if (!session) {
        console.log('No matching session found in memory');
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        console.log('Session expired');
        activeSessions.delete(sessionToken);
        return null;
      }

      console.log('Session validated successfully for user:', session.userId);

      // Get user information
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (!user) {
        console.log('User not found for session');
        return null;
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async refreshSession(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ sessionToken: string; refreshToken: string } | null> {
    try {
      console.log('Refreshing session - not implemented for simple auth');
      return null;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      console.log('Invalidating session');

      // Try database sessions first
      try {
        // Find session by direct token comparison (tokens are stored in plain text now)
        const matchingSession = await db.select()
          .from(sessions)
          .where(eq(sessions.token, sessionToken))
          .limit(1);

        if (matchingSession.length > 0) {
          await db.delete(sessions).where(eq(sessions.id, matchingSession[0].id));
          console.log('Session invalidated successfully from database');
          return;
        }
      } catch (error) {
        console.log('Database session invalidation failed, trying in-memory fallback:', error);
      }

      // Fallback to in-memory sessions
      const activeSessions = (global as any).activeSessions || new Map();
      if (activeSessions.has(sessionToken)) {
        activeSessions.delete(sessionToken);
        console.log('Session invalidated successfully from memory');
      } else {
        console.log('Session not found for invalidation');
      }
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  async invalidateSessionById(sessionId: number): Promise<void> {
    try {
      console.log('Invalidating session by ID:', sessionId);
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      console.log('Session invalidated successfully');
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  async invalidateAllUserSessions(userId: number): Promise<void> {
    try {
      console.log('Invalidating all sessions for user:', userId);
      await db.delete(sessions).where(eq(sessions.userId, userId));
      console.log('All user sessions invalidated successfully');
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
    }
  }

  // Utility methods for password hashing and session token generation
  private hashPassword(password: string): string {
    // Fallback for older versions, should be replaced with Argon2
    return crypto.pbkdf2Sync(password, crypto.randomBytes(16).toString('hex'), 10000, 64, 'sha512').toString('hex');
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Database implementation methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Hash password with Argon2 before storing
      const hashedPassword = await argon2.hash(userData.password);

      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning();

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Falha ao criar usuário');
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    try {
      const updateData = { ...userData };

      // If password is being updated, hash it with Argon2
      if (updateData.password) {
        updateData.password = await argon2.hash(updateData.password);
      }

      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Falha ao atualizar usuário');
    }
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async updateUserPreferences(userId: number, preferencesData: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Check if preferences exist
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferencesData,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...preferencesData
        })
        .returning();
      return created;
    }
  }

  async getNavigationItems(): Promise<NavigationItem[]> {
    return await db.select().from(navigationItems).orderBy(navigationItems.order);
  }

  async createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> {
    const [navItem] = await db.insert(navigationItems).values(item).returning();
    return navItem;
  }

  async deleteNavigationItem(id: number): Promise<void> {
    await db.delete(navigationItems).where(eq(navigationItems.id, id));
  }

  async getDashboardStats(userId: number): Promise<DashboardStats | undefined> {
    const cartItems = await this.getCartItems(userId);
    const notifications = await this.getNotifications(userId);
    const emails = await this.getEmails(userId);

    // Get real counts from database
    const [
      clients,
      products,
      sales,
      suppliers,
      supportTickets
    ] = await Promise.all([
      this.getClients(),
      this.getProducts(),
      this.getSales(),
      this.getSuppliers(),
      this.getSupportTickets()
    ]);

    return {
      id: 1,
      userId,
      cartCount: cartItems.length,
      notificationCount: notifications.filter(n => !n.isRead).length,
      emailCount: emails.filter(e => !e.isRead).length,
      clientsCount: clients.length,
      productsCount: products.length,
      salesCount: sales.length,
      suppliersCount: suppliers.length,
      supportTicketsCount: supportTickets.length,
      stats: {
        totalProjects: 12,
        activeTasks: 24,
        teamMembers: 8,
        revenue: 47500
      }
    };
  }

  async updateDashboardStats(userId: number, updates: Partial<InsertDashboardStats>): Promise<DashboardStats> {
    const current = await this.getDashboardStats(userId);
    return { ...current!, ...updates };
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    const now = new Date().toISOString();
    return [
      {
        id: 1,
        userId,
        productName: "Dashboard Pro License",
        productImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop",
        price: 99.99,
        quantity: 2,
        createdAt: now
      },
      {
        id: 2,
        userId,
        productName: "Premium Support Package",
        productImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop",
        price: 149.50,
        quantity: 1,
        createdAt: now
      },
      {
        id: 3,
        userId,
        productName: "Custom Integration",
        productImage: "https://images.unsplash.com/photo-15187706604308-77671226056f?w=100&h=100&fit=crop",
        price: 299.00,
        quantity: 1,
        createdAt: now
      }
    ];
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
    const now = new Date().toISOString();
    const notifications = [
      {
        id: 1,
        userId,
        title: "Novo projeto atribuído",
        message: "Você foi atribuído ao projeto Alpha como desenvolvedor principal",
        type: "info",
        serviceType: "system",
        senderName: "Sistema",
        senderAvatar: null,
        isRead: false,
        createdAt: now
      },
      {
        id: 2,
        userId,
        title: "Reunião agendada",
        message: "Reunião de planejamento agendada para amanhã às 14:00",
        type: "warning",
        serviceType: "calendar",
        senderName: "Maria Silva",
        senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face",
        isRead: false,
        createdAt: now
      },
      {
        id: 3,
        userId,
        title: "Tarefa concluída",
        message: "Design do sistema foi aprovado pelo cliente",
        type: "success",
        serviceType: "task",
        senderName: "João Santos",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        isRead: true,
        createdAt: now
      },
      {
        id: 4,
        userId,
        title: "Prazo próximo",
        message: "Entrega do projeto Beta em 2 dias",
        type: "warning",
        serviceType: "deadline",
        senderName: "Sistema",
        senderAvatar: null,
        isRead: false,
        createdAt: now
      },
      {
        id: 5,
        userId,
        title: "Novo comentário",
        message: "Ana comentou no seu documento de especificações",
        type: "info",
        serviceType: "comment",
        senderName: "Ana Costa",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        isRead: false,
        createdAt: now
      }
    ];
    return notifications.slice(0, limit);
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
    const now = new Date().toISOString();
    const emails = [
      {
        id: 1,
        userId,
        sender: "Carlos Mendes",
        senderEmail: "carlos@techcorp.com",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
        subject: "Proposta de Projeto",
        preview: "Gostaria de discutir uma nova oportunidade de desenvolvimento...",
        serviceType: "email",
        isRead: false,
        createdAt: now
      },
      {
        id: 2,
        userId,
        sender: "WhatsApp Business",
        senderEmail: "noreply@whatsapp.com",
        senderAvatar: null,
        subject: "Nova mensagem do cliente",
        preview: "Olá! Preciso de ajuda com o sistema que desenvolveram...",
        serviceType: "whatsapp",
        isRead: false,
        createdAt: now
      },
      {
        id: 3,
        userId,
        sender: "Telegram Bot",
        senderEmail: "bot@telegram.org",
        senderAvatar: null,
        subject: "Relatório diário",
        preview: "Resumo das atividades do dia: 15 tarefas concluídas...",
        serviceType: "telegram",
        isRead: true,
        createdAt: now
      },
      {
        id: 4,
        userId,
        sender: "Laura Santos",
        senderEmail: "laura@startup.io",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
        subject: "Reunião de alinhamento",
        preview: "Podemos agendar uma reunião para alinhar os próximos passos?",
        serviceType: "email",
        isRead: false,
        createdAt: now
      },
      {
        id: 5,
        userId,
        sender: "Sistema Push",
        senderEmail: "notifications@app.com",
        senderAvatar: null,
        subject: "Backup concluído",
        preview: "O backup automático foi realizado com sucesso às 03:00",
        serviceType: "push",
        isRead: true,
        createdAt: now
      },
      {
        id: 6,
        userId,
        sender: "Roberto Lima",
        senderEmail: "roberto@empresa.com.br",
        senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        subject: "Feedback do projeto",
        preview: "Excelente trabalho no último projeto! Gostaria de propor...",
        serviceType: "email",
        isRead: false,
        createdAt: now
      },
      {
        id: 7,
        userId,
        sender: "WhatsApp Business",
        senderEmail: "noreply@whatsapp.com",
        senderAvatar: null,
        subject: "Cliente urgente",
        preview: "Preciso resolver um problema crítico no sistema hoje mesmo!",
        serviceType: "whatsapp",
        isRead: false,
        createdAt: now
      },
      {
        id: 8,
        userId,
        sender: "Sistema",
        senderEmail: "system@dashboard.com",
        senderAvatar: null,
        subject: "Atualização disponível",
        preview: "Nova versão do dashboard disponível com melhorias...",
        serviceType: "system",
        isRead: true,
        createdAt: now
      },
      {
        id: 9,
        userId,
        sender: "Telegram Bot",
        senderEmail: "bot@telegram.org",
        senderAvatar: null,
        subject: "Lembrete importante",
        preview: "Não esqueça da apresentação para o cliente às 16:00",
        serviceType: "telegram",
        isRead: false,
        createdAt: now
      },
      {
        id: 10,
        userId,
        sender: "Patricia Oliveira",
        senderEmail: "patricia@consultoria.com",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        subject: "Proposta de parceria",
        preview: "Nossa empresa está interessada em estabelecer uma parceria...",
        serviceType: "email",
        isRead: false,
        createdAt: now
      }
    ];
    return emails.slice(0, limit);
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
    try {
      console.log(`[Delete Client] Attempting to delete client with ID: ${id}`);
      
      // Check if client exists first
      const [existingClient] = await db.select().from(clients).where(eq(clients.id, id));
      if (!existingClient) {
        console.log(`[Delete Client] Client with ID ${id} not found`);
        throw new Error(`Client with ID ${id} not found`);
      }
      
      console.log(`[Delete Client] Found client: ${existingClient.name} (${existingClient.email})`);
      
      // Check for foreign key constraints - sales table
      const relatedSales = await db.select({ count: sql`COUNT(*)` })
        .from(sales)
        .where(eq(sales.clientId, id));
      
      console.log(`[Delete Client] Found ${relatedSales[0]?.count || 0} related sales`);
      
      // Check for foreign key constraints - support tickets
      const relatedTickets = await db.select({ count: sql`COUNT(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.clientId, id));
      
      console.log(`[Delete Client] Found ${relatedTickets[0]?.count || 0} related support tickets`);
      
      // If there are related sales, we need to handle them first
      if (relatedSales[0]?.count && Number(relatedSales[0].count) > 0) {
        console.log(`[Delete Client] Cannot delete client - has ${relatedSales[0].count} related sales`);
        throw new Error(`Cannot delete client - client has ${relatedSales[0].count} related sales. Please delete or reassign sales first.`);
      }
      
      // Proceed with deletion
      console.log(`[Delete Client] Proceeding with deletion of client ID: ${id}`);
      const result = await db.delete(clients).where(eq(clients.id, id));
      console.log(`[Delete Client] Deletion completed successfully for client ID: ${id}`);
      
    } catch (error) {
      console.error(`[Delete Client] Error deleting client ID ${id}:`, error);
      throw error;
    }
  }

  // Client Discount Plans CRUD operations
  async getClientDiscountPlans(): Promise<ClientDiscountPlan[]> {
    return await db.select().from(clientDiscountPlans).orderBy(clientDiscountPlans.order, clientDiscountPlans.name);
  }

  async getClientDiscountPlan(id: number): Promise<ClientDiscountPlan | undefined> {
    const [plan] = await db.select().from(clientDiscountPlans).where(eq(clientDiscountPlans.id, id));
    return plan || undefined;
  }

  async createClientDiscountPlan(plan: InsertClientDiscountPlan): Promise<ClientDiscountPlan> {
    const [newPlan] = await db.insert(clientDiscountPlans).values(plan).returning();
    return newPlan;
  }

  async updateClientDiscountPlan(id: number, plan: Partial<InsertClientDiscountPlan>): Promise<ClientDiscountPlan> {
    const [updatedPlan] = await db.update(clientDiscountPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(clientDiscountPlans.id, id))
      .returning();
    
    if (!updatedPlan) {
      throw new Error(`Client discount plan with ID ${id} not found`);
    }
    
    return updatedPlan;
  }

  async deleteClientDiscountPlan(id: number): Promise<void> {
    try {
      // Check if plan exists
      const existingPlan = await this.getClientDiscountPlan(id);
      if (!existingPlan) {
        throw new Error(`Client discount plan with ID ${id} not found`);
      }
      
      // Delete related discount rules first
      await db.delete(clientDiscountRules).where(eq(clientDiscountRules.discountPlanId, id));
      
      // Delete the plan
      await db.delete(clientDiscountPlans).where(eq(clientDiscountPlans.id, id));
    } catch (error) {
      console.error(`Error deleting client discount plan ID ${id}:`, error);
      throw error;
    }
  }

  // Client Discount Rules CRUD operations
  async getClientDiscountRules(): Promise<ClientDiscountRule[]> {
    return await db.select().from(clientDiscountRules).orderBy(clientDiscountRules.discountPlanId, clientDiscountRules.paymentMethod);
  }

  async getClientDiscountRulesByPlan(planId: number): Promise<ClientDiscountRule[]> {
    return await db.select().from(clientDiscountRules)
      .where(eq(clientDiscountRules.discountPlanId, planId))
      .orderBy(clientDiscountRules.paymentMethod);
  }

  async createClientDiscountRule(rule: InsertClientDiscountRule): Promise<ClientDiscountRule> {
    const [newRule] = await db.insert(clientDiscountRules).values(rule).returning();
    return newRule;
  }

  async updateClientDiscountRule(id: number, rule: Partial<InsertClientDiscountRule>): Promise<ClientDiscountRule> {
    const [updatedRule] = await db.update(clientDiscountRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(clientDiscountRules.id, id))
      .returning();
    
    if (!updatedRule) {
      throw new Error(`Client discount rule with ID ${id} not found`);
    }
    
    return updatedRule;
  }

  async deleteClientDiscountRule(id: number): Promise<void> {
    await db.delete(clientDiscountRules).where(eq(clientDiscountRules.id, id));
  }

  // Category CRUD operations
  async getCategories(): Promise<Category[]>;
  async getCategories() {
    try {
      const allCategories = await db.select().from(categories);
      return allCategories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const now = new Date().toISOString();
    const [newCategory] = await db.insert(categories).values({
      ...category,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category> {
    const now = new Date().toISOString();
    const [updatedCategory] = await db.update(categories)
      .set({ ...categoryData, updatedAt: now })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Manufacturer CRUD operations
  async getManufacturers(): Promise<Manufacturer[]>;
  async getManufacturers() {
    try {
      const allManufacturers = await db.select().from(manufacturers);
      return allManufacturers;
    } catch (error) {
      console.error('Error getting manufacturers:', error);
      return [];
    }
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer || undefined;
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const now = new Date().toISOString();
    const [newManufacturer] = await db.insert(manufacturers).values({
      ...manufacturer,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newManufacturer;
  }

  async updateManufacturer(id: number, manufacturerData: Partial<InsertManufacturer>): Promise<Manufacturer> {
    const now = new Date().toISOString();
    const [updatedManufacturer] = await db.update(manufacturers)
      .set({ ...manufacturerData, updatedAt: now })
      .where(eq(manufacturers.id, id))
      .returning();
    return updatedManufacturer;
  }

  async deleteManufacturer(id: number): Promise<void> {
    await db.delete(manufacturers).where(eq(manufacturers.id, id));
  }

  // Product Group CRUD operations
  async getProductGroups(): Promise<ProductGroup[]> {
    return await db.select().from(productGroups).orderBy(productGroups.name);
  }

  async getProductGroup(id: number): Promise<ProductGroup | undefined> {
    const [group] = await db.select().from(productGroups).where(eq(productGroups.id, id));
    return group || undefined;
  }

  async createProductGroup(group: InsertProductGroup): Promise<ProductGroup> {
    const now = new Date().toISOString();
    const [newGroup] = await db.insert(productGroups).values({
      ...group,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newGroup;
  }

  async updateProductGroup(id: number, groupData: Partial<InsertProductGroup>): Promise<ProductGroup> {
    const now = new Date().toISOString();
    const [updatedGroup] = await db.update(productGroups)
      .set({ ...groupData, updatedAt: now })
      .where(eq(productGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteProductGroup(id: number): Promise<void> {
    await db.delete(productGroups).where(eq(productGroups.id, id));
  }

  // Product CRUD operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const now = new Date().toISOString();
    const [newProduct] = await db.insert(products).values({
      ...product,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    const now = new Date().toISOString();
    const [updatedProduct] = await db.update(products)
      .set({ ...productData, updatedAt: now })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Service CRUD operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.name);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const now = new Date().toISOString();
    const [newService] = await db.insert(services).values({
      ...service,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newService;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service> {
    const now = new Date().toISOString();
    const [updatedService] = await db.update(services)
      .set({ ...serviceData, updatedAt: now })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Supplier CRUD operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const now = new Date().toISOString();
    const [newSupplier] = await db.insert(suppliers).values({
      ...supplier,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplierData: Partial<InsertSupplier>): Promise<Supplier> {
    const now = new Date().toISOString();
    const [updatedSupplier] = await db.update(suppliers)
      .set({ ...supplierData, updatedAt: now })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Providers CRUD operations
  async getProviders(): Promise<Provider[]> {
    return await db.select().from(providers).orderBy(providers.name);
  }

  async getProvider(id: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const [newProvider] = await db.insert(providers).values(provider).returning();
    return newProvider;
  }

  async updateProvider(id: number, providerData: Partial<InsertProvider>): Promise<Provider> {
    const [updatedProvider] = await db.update(providers)
      .set(providerData)
      .where(eq(providers.id, id))
      .returning();
    return updatedProvider;
  }

  async deleteProvider(id: number): Promise<void> {
    await db.delete(providers).where(eq(providers.id, id));
  }

  // Sales CRUD operations
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(sales.saleDate);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSaleById(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const now = new Date().toISOString();
    const [newSale] = await db.insert(sales).values({
      ...sale,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newSale;
  }

  async updateSale(id: number, saleData: Partial<InsertSale>): Promise<Sale> {
    const now = new Date().toISOString();
    const [updatedSale] = await db.update(sales)
      .set({ ...saleData, updatedAt: now })
      .where(eq(sales.id, id))
      .returning();
    return updatedSale;
  }

  async deleteSale(id: number): Promise<void> {
    await db.delete(sales).where(eq(sales.id, id));
  }

  // Sale Items CRUD operations
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem> {
    const now = new Date().toISOString();
    const [newSaleItem] = await db.insert(saleItems).values({
      ...saleItem,
      createdAt: now
    }).returning();
    return newSaleItem;
  }

  async updateSaleItem(id: number, saleItemData: Partial<InsertSaleItem>): Promise<SaleItem> {
    const [updatedSaleItem] = await db.update(saleItems)
      .set(saleItemData)
      .where(eq(saleItems.id, id))
      .returning();
    return updatedSaleItem;
  }

  async deleteSaleItem(id: number): Promise<void> {
    await db.delete(saleItems).where(eq(saleItems.id, id));
  }

  // Support Tickets
  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets);
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const now = new Date().toISOString();
    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        ...ticket,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      })
      .returning();
    return newTicket;
  }

  async updateSupportTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({
        ...ticketData,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteSupportTicket(id: number): Promise<void> {
    await db.delete(supportTickets).where(eq(supportTickets.id, id));
  }

  // Support Ticket Messages
  async getSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]> {
    return await db.select().from(supportTicketMessages).where(eq(supportTicketMessages.ticketId, ticketId));
  }

  async createSupportTicketMessage(message: InsertSupportTicketMessage): Promise<SupportTicketMessage> {
    const [newMessage] = await db
      .insert(supportTicketMessages)
      .values({
        ...message,
        createdAt: new Date().toISOString()
      })
      .returning();
    return newMessage;
  }

  async updateSupportTicketMessage(id: number, messageData: Partial<InsertSupportTicketMessage>): Promise<SupportTicketMessage> {
    const [updatedMessage] = await db.update(supportTicketMessages)
      .set(messageData)
      .where(eq(supportTicketMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteSupportTicketMessage(id: number): Promise<void> {
    await db.delete(supportTicketMessages).where(eq(supportTicketMessages.id, id));
  }

  // Support Categories
  async getSupportCategories(): Promise<SupportCategory[]> {
    return await db.select().from(supportCategories);
  }

  async getSupportCategory(id: number): Promise<SupportCategory | undefined> {
    const [category] = await db.select().from(supportCategories).where(eq(supportCategories.id, id));
    return category || undefined;
  }

  async createSupportCategory(category: InsertSupportCategory): Promise<SupportCategory> {
    const [newCategory] = await db
      .insert(supportCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateSupportCategory(id: number, categoryData: Partial<InsertSupportCategory>): Promise<SupportCategory> {
    const [updatedCategory] = await db.update(supportCategories)
      .set(categoryData)
      .where(eq(supportCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteSupportCategory(id: number): Promise<void> {
    await db.delete(supportCategories).where(eq(supportCategories.id, id));
  }

  // Chatwoot Settings
  async getChatwootSettings(): Promise<ChatwootSettings[]> {
    return await db.select().from(chatwootSettings);
  }

  async getChatwootSetting(id: number): Promise<ChatwootSettings | undefined> {
    const [setting] = await db.select().from(chatwootSettings).where(eq(chatwootSettings.id, id));
    return setting || undefined;
  }

  async createChatwootSettings(settings: InsertChatwootSettings): Promise<ChatwootSettings> {
    const now = new Date().toISOString();
    const [newSettings] = await db
      .insert(chatwootSettings)
      .values({
        ...settings,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newSettings;
  }

  async updateChatwootSettings(id: number, settingsData: Partial<InsertChatwootSettings>): Promise<ChatwootSettings> {
    const [updatedSettings] = await db.update(chatwootSettings)
      .set({
        ...settingsData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(chatwootSettings.id, id))
      .returning();
    return updatedSettings;
  }

  async deleteChatwootSettings(id: number): Promise<void> {
    await db.delete(chatwootSettings).where(eq(chatwootSettings.id, id));
  }

  // Email Accounts
  async getEmailAccounts(): Promise<EmailAccount[]> {
    return await db.select().from(emailAccounts).orderBy(emailAccounts.isDefault, emailAccounts.name);
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account || undefined;
  }

  async createEmailAccount(data: InsertEmailAccount): Promise<EmailAccount> {
    try {
      // Hash password with Argon2 before storing
      const hashedPassword = await argon2.hash(data.password);

      // If this is the first email account, make it default
      const existingAccounts = await this.getEmailAccounts();
      const isFirstAccount = existingAccounts.length === 0;

      const [account] = await db
        .insert(emailAccounts)
        .values({
          ...data,
          username: data.username ?? "", // Ensure username is always a string
          password: hashedPassword,
          provider: data.provider ?? "", // Ensure provider is always a string
          isDefault: isFirstAccount || !!data.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // If setting as default, unset all other defaults
      if (account.isDefault) {
        await db
          .update(emailAccounts)
          .set({ isDefault: false })
          .where(sql`${emailAccounts.id} != ${account.id}`);
      }

      return account;
    } catch (error) {
      console.error('Error creating email account:', error);
      throw new Error('Falha ao criar conta de email');
    }
  }

  async updateEmailAccount(id: number, data: Partial<InsertEmailAccount>): Promise<EmailAccount> {
    try {
      const updateData = { ...data };

      // If password is being updated, hash it with Argon2
      if (updateData.password) {
        updateData.password = await argon2.hash(updateData.password);
      }

      //updateData.updatedAt = new Date().toISOString();

      const [account] = await db
        .update(emailAccounts)
        .set(updateData)
        .where(eq(emailAccounts.id, id))
        .returning();

      // If setting as default, unset all other defaults
      if (data.isDefault) {
        await db
          .update(emailAccounts)
          .set({ isDefault: false })
          .where(sql`${emailAccounts.id} != ${id}`);
      }

      return account;
    } catch (error) {
      console.error('Error updating email account:', error);
      throw new Error('Falha ao atualizar conta de email');
    }
  }

  async deleteEmailAccount(id: number): Promise<void> {
    await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
  }

  async setDefaultEmailAccount(id: number): Promise<EmailAccount> {
    // First, remove default from all accounts
    await db.update(emailAccounts).set({ isDefault: false });

    // Then set the selected account as default
    const [defaultAccount] = await db
      .update(emailAccounts)
      .set({
        isDefault: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(emailAccounts.id, id))
      .returning();
    return defaultAccount;
  }

  // User Permissions methods
  async getUserPermissions(): Promise<any[]> {
    try {
      (global as any).userPermissions = (global as any).userPermissions || [];
      return (global as any).userPermissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  async getUserPermissionsByUserId(userId: number): Promise<any[]> {
    try {
      (global as any).userPermissions = (global as any).userPermissions || [];
      return (global as any).userPermissions.filter((p: any) => p.userId === userId);
    } catch (error) {
      console.error('Error getting user permissions by user ID:', error);
      return [];
    }
  }

  async updateUserPermissions(userId: number, permissions: any[]): Promise<any[]> {
    try {
      (global as any).userPermissions = (global as any).userPermissions || [];

      // Remove existing permissions for this user
      (global as any).userPermissions = (global as any).userPermissions.filter((p: any) => p.userId !== userId);

      // Add new permissions
      const newPermissions = permissions.map(permission => ({
        id: Date.now() + Math.random(),
        userId,
        module: permission.module,
        canView: permission.canView || false,
        canCreate: permission.canCreate || false,
        canEdit: permission.canEdit || false,
        canDelete: permission.canDelete || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      (global as any).userPermissions.push(...newPermissions);

      return newPermissions;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  // User Address methods
  async getUserAddress(userId: number): Promise<UserAddress | null> {
    try {
      const [address] = await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
      return address || null;
    } catch (error) {
      console.error('Error getting user address:', error);
      return null;
    }
  }

  async updateUserAddress(userId: number, data: Partial<InsertUserAddress>): Promise<UserAddress> {
    try {
      const existing = await this.getUserAddress(userId);

      if (existing) {
        const [updated] = await db
          .update(userAddresses)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(userAddresses.userId, userId))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(userAddresses)
          .values({
            userId,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error updating user address:', error);
      throw new Error('Falha ao atualizar endereço do usuário');
    }
  }

  // Docker Containers methods
  async getDockerContainers(): Promise<DockerContainer[]> {
    try {
      const containers = await db.select().from(dockerContainers);
      return containers;
    } catch (error) {
      console.error('Error getting docker containers:', error);
      return [];
    }
  }

  async getDockerContainer(id: number): Promise<DockerContainer | undefined> {
    try {
      const [container] = await db.select().from(dockerContainers).where(eq(dockerContainers.id, id));
      return container;
    } catch (error) {
      console.error('Error getting docker container:', error);
      return undefined;
    }
  }

  async createDockerContainer(data: InsertDockerContainer): Promise<DockerContainer> {
    try {
      const [container] = await db
        .insert(dockerContainers)
        .values({
          ...data,
          status: "stopped",
          networkMode: data.networkMode || "bridge",
          restartPolicy: data.restartPolicy || "unless-stopped",
          environment: data.environment ? JSON.stringify(data.environment) : null,
          volumes: data.volumes ? JSON.stringify(data.volumes) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return container;
    } catch (error) {
      console.error('Error creating docker container:', error);
      throw error;
    }
  }

  async updateDockerContainer(id: number, data: Partial<InsertDockerContainer>): Promise<DockerContainer> {
    try {
      const [container] = await db
        .update(dockerContainers)
        .set({
          ...data,
          environment: data.environment ? JSON.stringify(data.environment) : null,
          volumes: data.volumes ? JSON.stringify(data.volumes) : null,
          updatedAt: new Date(),
        })
        .where(eq(dockerContainers.id, id))
        .returning();
      return container;
    } catch (error) {
      console.error('Error updating docker container:', error);
      throw error;
    }
  }

  async deleteDockerContainer(id: number): Promise<void> {
    try {
      await db.delete(dockerContainers).where(eq(dockerContainers.id, id));
    } catch (error) {
      console.error('Error deleting docker container:', error);
      throw error;
    }
  }

  async updateContainerStatus(id: number, status: string): Promise<DockerContainer> {
    try {
      const [container] = await db
        .update(dockerContainers)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(dockerContainers.id, id))
        .returning();
      return container;
    } catch (error) {
      console.error('Error updating container status:', error);
      throw error;
    }
  }

  // Webhook Configuration Methods
  async getWebhookConfigs(): Promise<WebhookConfig[]> {
    try {
      const configs = await db.select().from(webhookConfigs);
      return configs;
    } catch (error) {
      console.error('Error getting webhook configs:', error);
      throw error;
    }
  }

  async getWebhookConfig(id: number): Promise<WebhookConfig | undefined> {
    try {
      const [config] = await db.select().from(webhookConfigs).where(eq(webhookConfigs.id, id));
      return config;
    } catch (error) {
      console.error('Error getting webhook config:', error);
      throw error;
    }
  }

  async createWebhookConfig(configData: InsertWebhookConfig): Promise<WebhookConfig> {
    try {
      const [config] = await db.insert(webhookConfigs).values(configData).returning();
      return config;
    } catch (error) {
      console.error('Error creating webhook config:', error);
      throw error;
    }
  }

  async updateWebhookConfig(id: number, configData: Partial<InsertWebhookConfig>): Promise<WebhookConfig> {
    try {
      const [config] = await db
        .update(webhookConfigs)
        .set({
          ...configData,
          updatedAt: new Date()
        })
        .where(eq(webhookConfigs.id, id))
        .returning();
      return config;
    } catch (error) {
      console.error('Error updating webhook config:', error);
      throw error;
    }
  }

  async deleteWebhookConfig(id: number): Promise<void> {
    try {
      await db.delete(webhookConfigs).where(eq(webhookConfigs.id, id));
    } catch (error) {
      console.error('Error deleting webhook config:', error);
      throw error;
    }
  }

  async updateWebhookTestResult(id: number, status: string): Promise<WebhookConfig> {
    try {
      const [config] = await db
        .update(webhookConfigs)
        .set({
          lastTest: new Date(),
          lastTestStatus: status,
          updatedAt: new Date()
        })
        .where(eq(webhookConfigs.id, id))
        .returning();
      return config;
    } catch (error) {
      console.error('Error updating webhook test result:', error);
      throw error;
    }
  }

  // ==================== TASK SCHEDULER METHODS ====================

  async getScheduledTasks(): Promise<any[]> {
    try {
      const tasks = await db.select().from(scheduledTasks).orderBy(desc(scheduledTasks.createdAt));
      return tasks;
    } catch (error) {
      console.error('Error getting scheduled tasks:', error);
      throw error;
    }
  }

  async getScheduledTask(id: number): Promise<any | undefined> {
    try {
      const [task] = await db.select().from(scheduledTasks).where(eq(scheduledTasks.id, id));
      return task;
    } catch (error) {
      console.error('Error getting scheduled task:', error);
      throw error;
    }
  }

  async createScheduledTask(taskData: any): Promise<any> {
    try {
      const [task] = await db.insert(scheduledTasks).values({
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return task;
    } catch (error) {
      console.error('Error creating scheduled task:', error);
      throw error;
    }
  }

  async updateScheduledTask(id: number, taskData: any): Promise<any> {
    try {
      const [task] = await db
        .update(scheduledTasks)
        .set({
          ...taskData,
          updatedAt: new Date()
        })
        .where(eq(scheduledTasks.id, id))
        .returning();
      return task;
    } catch (error) {
      console.error('Error updating scheduled task:', error);
      throw error;
    }
  }

  async deleteScheduledTask(id: number): Promise<void> {
    try {
      // First delete related execution logs
      await db.delete(taskExecutionLogs).where(eq(taskExecutionLogs.taskId, id));
      // Then delete the task
      await db.delete(scheduledTasks).where(eq(scheduledTasks.id, id));
    } catch (error) {
      console.error('Error deleting scheduled task:', error);
      throw error;
    }
  }

  // ==================== TASK EXECUTION LOGS METHODS ====================

  async getTaskExecutionLogs(taskId: number, limit: number = 50): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(taskExecutionLogs)
        .where(eq(taskExecutionLogs.taskId, taskId))
        .orderBy(desc(taskExecutionLogs.startTime))
        .limit(limit);
      return logs;
    } catch (error) {
      console.error('Error getting task execution logs:', error);
      throw error;
    }
  }

  async getAllTaskExecutionLogs(limit: number = 100): Promise<any[]> {
    try {
      const logs = await db
        .select({
          id: taskExecutionLogs.id,
          taskId: taskExecutionLogs.taskId,
          status: taskExecutionLogs.status,
          startTime: taskExecutionLogs.startTime,
          endTime: taskExecutionLogs.endTime,
          output: taskExecutionLogs.output,
          exitCode: taskExecutionLogs.exitCode,
          taskName: scheduledTasks.name
        })
        .from(taskExecutionLogs)
        .leftJoin(scheduledTasks, eq(taskExecutionLogs.taskId, scheduledTasks.id))
        .orderBy(desc(taskExecutionLogs.startTime))
        .limit(limit);
      return logs;
    } catch (error) {
      console.error('Error getting all task execution logs:', error);
      throw error;
    }
  }

  async createTaskExecutionLog(logData: any): Promise<any> {
    try {
      const [log] = await db.insert(taskExecutionLogs).values({
        ...logData,
        createdAt: new Date()
      }).returning();
      return log;
    } catch (error) {
      console.error('Error creating task execution log:', error);
      throw error;
    }
  }

  async updateTaskExecutionLog(id: number, logData: any): Promise<any> {
    try {
      const [log] = await db
        .update(taskExecutionLogs)
        .set({
          ...logData,
          updatedAt: new Date()
        })
        .where(eq(taskExecutionLogs.id, id))
        .returning();
      return log;
    } catch (error) {
      console.error('Error updating task execution log:', error);
      throw error;
    }
  }

  async deleteTaskExecutionLog(id: number): Promise<void> {
    try {
      await db.delete(taskExecutionLogs).where(eq(taskExecutionLogs.id, id));
    } catch (error) {
      console.error('Error deleting task execution log:', error);
      throw error;
    }
  }

  async clearTaskExecutionLogs(taskId: number): Promise<void> {
    try {
      await db.delete(taskExecutionLogs).where(eq(taskExecutionLogs.taskId, taskId));
    } catch (error) {
      console.error('Error clearing task execution logs:', error);
      throw error;
    }
  }

  // ==================== TASK TEMPLATES METHODS ====================

  async getTaskTemplates(): Promise<any[]> {
    try {
      const templates = await db.select().from(taskTemplates).orderBy(asc(taskTemplates.category), asc(taskTemplates.name));
      return templates;
    } catch (error) {
      console.error('Error getting task templates:', error);
      throw error;
    }
  }

  async getTaskTemplate(id: number): Promise<any | undefined> {
    try {
      const [template] = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error getting task template:', error);
      throw error;
    }
  }

  async createTaskTemplate(templateData: any): Promise<any> {
    try {
      const [template] = await db.insert(taskTemplates).values({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return template;
    } catch (error) {
      console.error('Error creating task template:', error);
      throw error;
    }
  }

  async updateTaskTemplate(id: number, templateData: any): Promise<any> {
    try {
      const [template] = await db
        .update(taskTemplates)
        .set({
          ...templateData,
          updatedAt: new Date()
        })
        .where(eq(taskTemplates.id, id))
        .returning();
      return template;
    } catch (error) {
      console.error('Error updating task template:', error);
      throw error;
    }
  }

  async deleteTaskTemplate(id: number): Promise<void> {
    try {
      await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
    } catch (error) {
      console.error('Error deleting task template:', error);
      throw error;
    }
  }

  // Update navigation to add expenses management
  async updateNavigationForExpenses() {
    try {
      const existingExpenses = await db
        .select()
        .from(navigationItems)
        .where(eq(navigationItems.href, '/expenses'))
        .limit(1);

      if (existingExpenses.length > 0) {
        console.log('Expenses navigation item already exists');
        return;
      }

      console.log('Adding expenses navigation item...');

      await db.insert(navigationItems).values({
        label: 'Controle de Gastos',
        href: '/expenses',
        icon: 'CreditCard',
        order: 6,
        parentId: null
      });

      console.log('Expenses navigation item added successfully');
    } catch (error) {
      console.error('Error updating navigation for expenses:', error);
    }

    // Initialize default expense categories
    try {
      const existingCategories = await db
        .select()
        .from(expenseCategories)
        .limit(1);

      if (existingCategories.length > 0) {
        console.log('Expense categories already exist');
        return;
      }

      console.log('Creating default expense categories...');

      const defaultCategories = [
        {
          name: 'Infraestrutura',
          icon: 'Server',
          color: '#3B82F6',
          description: 'Serviços de hospedagem, domínios e infraestrutura'
        },
        {
          name: 'Software',
          icon: 'Code',
          color: '#8B5CF6',
          description: 'Licenças de software e aplicativos'
        },
        {
          name: 'Marketing',
          icon: 'Megaphone',
          color: '#EF4444',
          description: 'Publicidade, marketing digital e promoções'
        },
        {
          name: 'Recursos Humanos',
          icon: 'Users',
          color: '#10B981',
          description: 'Salários, benefícios e treinamentos'
        },
        {
          name: 'Operacional',
          icon: 'Settings',
          color: '#F59E0B',
          description: 'Custos operacionais gerais'
        },
        {
          name: 'Escritório',
          icon: 'Building',
          color: '#6366F1',
          description: 'Material de escritório, aluguel e utilidades'
        }
      ];

      for (const category of defaultCategories) {
        await db.insert(expenseCategories).values(category);
      }

      console.log('Default expense categories created successfully');
    } catch (error) {
      console.error('Error creating default expense categories:', error);
    }

    // Initialize default payment methods for Brazil
    try {
      const existingPaymentMethods = await db
        .select()
        .from(paymentMethods)
        .limit(1);

      if (existingPaymentMethods.length > 0) {
        console.log('Payment methods already exist');
        return;
      }

      console.log('Creating default Brazilian payment methods...');

      const defaultPaymentMethods = [
        {
          name: 'PIX',
          icon: 'Zap',
          color: '#00BC7E',
          sortOrder: 1
        },
        {
          name: 'Cartão de Crédito',
          icon: 'CreditCard',
          color: '#3B82F6',
          sortOrder: 2
        },
        {
          name: 'Cartão de Débito',
          icon: 'CreditCard',
          color: '#10B981',
          sortOrder: 3
        },
        {
          name: 'Boleto',
          icon: 'FileText',
          color: '#F59E0B',
          sortOrder: 4
        },
        {
          name: 'Transferência Bancária',
          icon: 'ArrowLeftRight',
          color: '#8B5CF6',
          sortOrder: 5
        },
        {
          name: 'Dinheiro',
          icon: 'DollarSign',
          color: '#22C55E',
          sortOrder: 6
        },
        {
          name: 'Cheque',
          icon: 'FileCheck',
          color: '#6B7280',
          sortOrder: 7
        },
        {
          name: 'PayPal',
          icon: 'Wallet',
          color: '#0070BA',
          sortOrder: 8
        },
        {
          name: 'Mercado Pago',
          icon: 'Smartphone',
          color: '#009EE3',
          sortOrder: 9
        },
        {
          name: 'PagSeguro',
          icon: 'Shield',
          color: '#F7941E',
          sortOrder: 10
        }
      ];

      for (const method of defaultPaymentMethods) {
        await db.insert(paymentMethods).values(method);
      }

      console.log('Default Brazilian payment methods created successfully');
    } catch (error) {
      console.error('Error creating default payment methods:', error);
    }
  }

  // ==================== EXPENSES METHODS ====================

  async getExpenses(): Promise<Expense[]> {
    try {
      const expensesList = await db.select().from(expenses).orderBy(desc(expenses.date));
      return expensesList;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
      return expense;
    } catch (error) {
      console.error("Error fetching expense:", error);
      throw error;
    }
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    try {
      const [expense] = await db.insert(expenses).values({
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return expense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  async updateExpense(id: number, expenseData: Partial<InsertExpense>): Promise<Expense> {
    try {
      const [expense] = await db
        .update(expenses)
        .set({
          ...expenseData,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, id))
        .returning();

      if (!expense) {
        throw new Error("Expense not found");
      }

      return expense;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  async getExpenseStats(): Promise<any> {
    try {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get all expenses for calculations
      const allExpenses = await this.getExpenses();

      // Calculate totals
      const totalMonth = allExpenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      const totalYear = allExpenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      // Group by category
      const categoryMap = new Map();
      allExpenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getFullYear() === currentYear;
        })
        .forEach(exp => {
          const category = exp.category;
          if (categoryMap.has(category)) {
            categoryMap.get(category).total += parseFloat(exp.amount);
            categoryMap.get(category).count += 1;
          } else {
            categoryMap.set(category, {
              category,
              total: parseFloat(exp.amount),
              count: 1
            });
          }
        });

      const byCategory = Array.from(categoryMap.values())
        .sort((a, b) => b.total - a.total);

      // Monthly trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthExpenses = allExpenses
          .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === date.getMonth() &&
              expDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        monthlyTrend.push({
          month: date.toLocaleString('pt-BR', { month: 'short' }),
          total: monthExpenses
        });
      }

      return {
        totalMonth,
        totalYear,
        byCategory,
        monthlyTrend
      };
    } catch (error) {
      console.error("Error calculating expense stats:", error);
      throw error;
    }
  }

  // ===== EXPENSE CATEGORIES METHODS =====

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      const categories = await db.select()
        .from(expenseCategories)
        .where(eq(expenseCategories.isActive, true))
        .orderBy(expenseCategories.sortOrder, expenseCategories.name);
      return categories;
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      throw error;
    }
  }

  async getExpenseCategory(id: number): Promise<ExpenseCategory | undefined> {
    try {
      const category = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
      return category[0];
    } catch (error) {
      console.error("Error fetching expense category:", error);
      throw error;
    }
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    try {
      const newCategory = await db.insert(expenseCategories).values(category).returning();
      return newCategory[0];
    } catch (error) {
      console.error("Error creating expense category:", error);
      throw error;
    }
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory> {
    try {
      const updatedCategory = await db.update(expenseCategories)
        .set({ ...category, updatedAt: new Date() })
        .where(eq(expenseCategories.id, id))
        .returning();

      if (updatedCategory.length === 0) {
        throw new Error("Categoria não encontrada");
      }

      return updatedCategory[0];
    } catch (error) {
      console.error("Error updating expense category:", error);
      throw error;
    }
  }

  async deleteExpenseCategory(id: number): Promise<void> {
    try {
      // Soft delete - apenas marcar como inativo
      await db.update(expenseCategories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(expenseCategories.id, id));
    } catch (error) {
      console.error("Error deleting expense category:", error);
      throw error;
    }
  }

  // ===== PAYMENT METHODS METHODS =====

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const methods = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(paymentMethods.sortOrder, paymentMethods.name);
      return methods;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    try {
      const method = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
      return method[0];
    } catch (error) {
      console.error("Error fetching payment method:", error);
      throw error;
    }
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    try {
      const newMethod = await db.insert(paymentMethods).values(method).returning();
      return newMethod[0];
    } catch (error) {
      console.error("Error creating payment method:", error);
      throw error;
    }
  }

  async updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    try {
      const updatedMethod = await db.update(paymentMethods)
        .set({ ...method, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id))
        .returning();

      if (updatedMethod.length === 0) {
        throw new Error("Método de pagamento não encontrado");
      }

      return updatedMethod[0];
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  }

  async deletePaymentMethod(id: number): Promise<void> {
    try {
      // Soft delete - apenas marcar como inativo
      await db.update(paymentMethods)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id));
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }

  // ===== EXPENSE REMINDERS METHODS =====

  async getExpenseReminders(): Promise<ExpenseReminder[]> {
    try {
      const reminders = await db.select().from(expenseReminders).where(eq(expenseReminders.active, true));
      return reminders;
    } catch (error) {
      console.error("Error fetching expense reminders:", error);
      throw error;
    }
  }

  async getExpenseReminder(id: number): Promise<ExpenseReminder | undefined> {
    try {
      const reminder = await db.select().from(expenseReminders).where(eq(expenseReminders.id, id));
      return reminder[0];
    } catch (error) {
      console.error("Error fetching expense reminder:", error);
      throw error;
    }
  }

  async createExpenseReminder(reminder: InsertExpenseReminder): Promise<ExpenseReminder> {
    try {
      const newReminder = await db.insert(expenseReminders).values(reminder).returning();
      return newReminder[0];
    } catch (error) {
      console.error("Error creating expense reminder:", error);
      throw error;
    }
  }

  async updateExpenseReminder(id: number, reminder: Partial<InsertExpenseReminder>): Promise<ExpenseReminder> {
    try {
      const updatedReminder = await db.update(expenseReminders)
        .set({ ...reminder, updatedAt: new Date() })
        .where(eq(expenseReminders.id, id))
        .returning();

      if (updatedReminder.length === 0) {
        throw new Error("Lembrete não encontrado");
      }

      return updatedReminder[0];
    } catch (error) {
      console.error("Error updating expense reminder:", error);
      throw error;
    }
  }

  async deleteExpenseReminder(id: number): Promise<void> {
    try {
      await db.update(expenseReminders)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(expenseReminders.id, id));
    } catch (error) {
      console.error("Error deleting expense reminder:", error);
      throw error;
    }
  }

  async getActiveReminders(): Promise<ExpenseReminder[]> {
    try {
      const now = new Date();
      const reminders = await db.select()
        .from(expenseReminders)
        .where(
          and(
            eq(expenseReminders.active, true),
            eq(expenseReminders.sent, false),
            sql`${expenseReminders.reminderDate} <= ${now}`
          )
        );
      return reminders;
    } catch (error) {
      console.error("Error fetching active reminders:", error);
      throw error;
    }
  }

  // ===== EXCHANGE RATES METHODS =====

  async getExchangeRates(): Promise<ExchangeRate[]> {
    try {
      return await db.select().from(exchangeRates).orderBy(desc(exchangeRates.updatedAt));
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      throw error;
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string = 'BRL'): Promise<ExchangeRate | undefined> {
    try {
      const rates = await db.select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency)
          )
        )
        .orderBy(desc(exchangeRates.updatedAt))
        .limit(1);

      return rates[0];
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      throw error;
    }
  }

  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    try {
      const newRate = await db.insert(exchangeRates)
        .values({
          ...rate,
          updatedAt: new Date()
        })
        .returning();
      return newRate[0];
    } catch (error) {
      console.error("Error creating exchange rate:", error);
      throw error;
    }
  }

  async updateExchangeRate(id: number, rate: Partial<InsertExchangeRate>): Promise<ExchangeRate> {
    try {
      const updatedRate = await db.update(exchangeRates)
        .set({
          ...rate,
          updatedAt: new Date()
        })
        .where(eq(exchangeRates.id, id))
        .returning();

      if (updatedRate.length === 0) {
        throw new Error("Exchange rate not found");
      }

      return updatedRate[0];
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      throw error;
    }
  }

  async deleteExchangeRate(id: number): Promise<void> {
    try {
      const result = await db.delete(exchangeRates)
        .where(eq(exchangeRates.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Exchange rate not found");
      }
    } catch (error) {
      console.error("Error deleting exchange rate:", error);
      throw error;
    }
  }

  async getLatestExchangeRate(fromCurrency: string, toCurrency: string = 'BRL'): Promise<ExchangeRate | undefined> {
    try {
      // Get the most recent rate for the currency pair
      const rates = await db.select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency)
          )
        )
        .orderBy(desc(exchangeRates.updatedAt))
        .limit(1);

      return rates[0];
    } catch (error) {
      console.error("Error fetching latest exchange rate:", error);
      throw error;
    }
  }

  async getExchangeRateHistory(fromCurrency: string, toCurrency: string = 'BRL', days: number = 30): Promise<ExchangeRate[]> {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rates = await db.select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency),
            gte(exchangeRates.date, dateLimit)
          )
        )
        .orderBy(desc(exchangeRates.date))
        .limit(100); // Limit to avoid too much data

      return rates;
    } catch (error) {
      console.error("Error fetching exchange rate history:", error);
      throw error;
    }
  }

  async updateExchangeRates(): Promise<void> {
    try {
      // Fetch current rates from API (example: exchangerate-api.com)
      const apiKey = process.env.EXCHANGE_API_KEY;
      if (!apiKey) {
        console.warn("EXCHANGE_API_KEY not set, skipping exchange rate update");
        return;
      }

      const currencies = ['USD', 'EUR']; // Add more currencies as needed
      const baseCurrency = 'BRL';

      for (const currency of currencies) {
        if (currency === baseCurrency) continue;

        try {
          // Fetch rate from API
          const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${currency}/${baseCurrency}`);
          const data = await response.json();

          if (data.result === 'success') {
            // Check if rate exists
            const existingRate = await this.getLatestExchangeRate(currency, baseCurrency);

            if (existingRate) {
              // Update existing rate
              await this.updateExchangeRate(existingRate.id, {
                rate: data.conversion_rate
              });
            } else {
              // Create new rate
              await this.createExchangeRate({
                fromCurrency: currency,
                toCurrency: baseCurrency,
                rate: data.conversion_rate
              });
            }

            console.log(`Updated exchange rate: ${currency} to ${baseCurrency} = ${data.conversion_rate}`);
          }
        } catch (error) {
          console.error(`Error updating exchange rate for ${currency}:`, error);
        }
      }
    } catch (error) {
      console.error("Error updating exchange rates:", error);
      throw error;
    }
  }

  // Plans methods
  async getPlans(): Promise<Plan[]> {
    try {
      const result = await db.select().from(plans).orderBy(asc(plans.sortOrder));
      return result;
    } catch (error) {
      console.error("Error getting plans:", error);
      throw error;
    }
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    try {
      const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plan:", error);
      throw error;
    }
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    try {
      // If this plan is being set as default, unset all other defaults first
      if (plan.isDefault) {
        await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
      }

      const result = await db.insert(plans).values({
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  }

  async updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan> {
    try {
      // If this plan is being set as default, unset all other defaults first
      if (plan.isDefault) {
        await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
      }

      const result = await db.update(plans)
        .set({
          ...plan,
          updatedAt: new Date()
        })
        .where(eq(plans.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating plan:", error);
      throw error;
    }
  }

  async deletePlan(id: number): Promise<void> {
    try {
      const result = await db.delete(plans).where(eq(plans.id, id)).returning();
      
      if (result.length === 0) {
        throw new Error("Plan not found");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      throw error;
    }
  }

  // Plan Payment Discounts methods
  async getPlanPaymentDiscounts(planId: number): Promise<PlanPaymentDiscount[]> {
    try {
      const result = await db.select()
        .from(planPaymentDiscounts)
        .where(eq(planPaymentDiscounts.planId, planId));
      return result;
    } catch (error) {
      console.error("Error getting plan payment discounts:", error);
      throw error;
    }
  }

  async getPlanPaymentDiscount(id: number): Promise<PlanPaymentDiscount | undefined> {
    try {
      const result = await db.select()
        .from(planPaymentDiscounts)
        .where(eq(planPaymentDiscounts.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plan payment discount:", error);
      throw error;
    }
  }

  async createPlanPaymentDiscount(discount: InsertPlanPaymentDiscount): Promise<PlanPaymentDiscount> {
    try {
      const result = await db.insert(planPaymentDiscounts)
        .values({
          ...discount,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating plan payment discount:", error);
      throw error;
    }
  }

  async updatePlanPaymentDiscount(id: number, discount: Partial<InsertPlanPaymentDiscount>): Promise<PlanPaymentDiscount> {
    try {
      const result = await db.update(planPaymentDiscounts)
        .set({
          ...discount,
          updatedAt: new Date()
        })
        .where(eq(planPaymentDiscounts.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan payment discount not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating plan payment discount:", error);
      throw error;
    }
  }

  async deletePlanPaymentDiscount(id: number): Promise<void> {
    try {
      const result = await db.delete(planPaymentDiscounts)
        .where(eq(planPaymentDiscounts.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan payment discount not found");
      }
    } catch (error) {
      console.error("Error deleting plan payment discount:", error);
      throw error;
    }
  }

  // Plan Subscription Discounts methods
  async getPlanSubscriptionDiscounts(planId: number): Promise<PlanSubscriptionDiscount[]> {
    try {
      const result = await db.select()
        .from(planSubscriptionDiscounts)
        .where(eq(planSubscriptionDiscounts.planId, planId));
      return result;
    } catch (error) {
      console.error("Error getting plan subscription discounts:", error);
      throw error;
    }
  }

  async getPlanSubscriptionDiscount(id: number): Promise<PlanSubscriptionDiscount | undefined> {
    try {
      const result = await db.select()
        .from(planSubscriptionDiscounts)
        .where(eq(planSubscriptionDiscounts.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plan subscription discount:", error);
      throw error;
    }
  }

  async createPlanSubscriptionDiscount(discount: InsertPlanSubscriptionDiscount): Promise<PlanSubscriptionDiscount> {
    try {
      const result = await db.insert(planSubscriptionDiscounts)
        .values({
          ...discount,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating plan subscription discount:", error);
      throw error;
    }
  }

  async updatePlanSubscriptionDiscount(id: number, discount: Partial<InsertPlanSubscriptionDiscount>): Promise<PlanSubscriptionDiscount> {
    try {
      const result = await db.update(planSubscriptionDiscounts)
        .set({
          ...discount,
          updatedAt: new Date()
        })
        .where(eq(planSubscriptionDiscounts.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan subscription discount not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating plan subscription discount:", error);
      throw error;
    }
  }

  async deletePlanSubscriptionDiscount(id: number): Promise<void> {
    try {
      const result = await db.delete(planSubscriptionDiscounts)
        .where(eq(planSubscriptionDiscounts.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan subscription discount not found");
      }
    } catch (error) {
      console.error("Error deleting plan subscription discount:", error);
      throw error;
    }
  }

  // Plan Resources methods
  async getPlanResources(): Promise<PlanResource[]> {
    try {
      const result = await db.select().from(planResources).orderBy(asc(planResources.sortOrder));
      return result;
    } catch (error) {
      console.error("Error getting plan resources:", error);
      throw error;
    }
  }

  async getPlanResource(id: number): Promise<PlanResource | undefined> {
    try {
      const result = await db.select().from(planResources).where(eq(planResources.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plan resource:", error);
      throw error;
    }
  }

  async createPlanResource(resource: InsertPlanResource): Promise<PlanResource> {
    try {
      const result = await db.insert(planResources)
        .values({
          ...resource,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating plan resource:", error);
      throw error;
    }
  }

  async updatePlanResource(id: number, resource: Partial<InsertPlanResource>): Promise<PlanResource> {
    try {
      const result = await db.update(planResources)
        .set({
          ...resource,
          updatedAt: new Date()
        })
        .where(eq(planResources.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan resource not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating plan resource:", error);
      throw error;
    }
  }

  async deletePlanResource(id: number): Promise<void> {
    try {
      const result = await db.delete(planResources)
        .where(eq(planResources.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan resource not found");
      }
    } catch (error) {
      console.error("Error deleting plan resource:", error);
      throw error;
    }
  }

  // Plan Resource Assignments methods
  async getPlanResourceAssignments(planId: number): Promise<PlanResourceAssignment[]> {
    try {
      const result = await db.select()
        .from(planResourceAssignments)
        .where(eq(planResourceAssignments.planId, planId));
      return result;
    } catch (error) {
      console.error("Error getting plan resource assignments:", error);
      throw error;
    }
  }

  async getAllPlanResourceAssignments(): Promise<(PlanResourceAssignment & { resource: PlanResource })[]> {
    try {
      const result = await db.select({
        id: planResourceAssignments.id,
        planId: planResourceAssignments.planId,
        resourceId: planResourceAssignments.resourceId,
        isEnabled: planResourceAssignments.isEnabled,
        customValue: planResourceAssignments.customValue,
        createdAt: planResourceAssignments.createdAt,
        updatedAt: planResourceAssignments.updatedAt,
        resource: {
          id: planResources.id,
          name: planResources.name,
          value: planResources.value,
          image: planResources.image,
          isActive: planResources.isActive,
          sortOrder: planResources.sortOrder,
          createdAt: planResources.createdAt,
          updatedAt: planResources.updatedAt,
        }
      })
        .from(planResourceAssignments)
        .innerJoin(planResources, eq(planResourceAssignments.resourceId, planResources.id));
      return result;
    } catch (error) {
      console.error("Error getting all plan resource assignments:", error);
      throw error;
    }
  }

  async getPlanResourceAssignment(id: number): Promise<PlanResourceAssignment | undefined> {
    try {
      const result = await db.select()
        .from(planResourceAssignments)
        .where(eq(planResourceAssignments.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plan resource assignment:", error);
      throw error;
    }
  }

  async createPlanResourceAssignment(assignment: InsertPlanResourceAssignment): Promise<PlanResourceAssignment> {
    try {
      const result = await db.insert(planResourceAssignments)
        .values({
          ...assignment,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating plan resource assignment:", error);
      throw error;
    }
  }

  async updatePlanResourceAssignment(id: number, assignment: Partial<InsertPlanResourceAssignment>): Promise<PlanResourceAssignment> {
    try {
      const result = await db.update(planResourceAssignments)
        .set({
          ...assignment,
          updatedAt: new Date()
        })
        .where(eq(planResourceAssignments.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan resource assignment not found");
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating plan resource assignment:", error);
      throw error;
    }
  }

  async deletePlanResourceAssignment(id: number): Promise<void> {
    try {
      const result = await db.delete(planResourceAssignments)
        .where(eq(planResourceAssignments.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error("Plan resource assignment not found");
      }
    } catch (error) {
      console.error("Error deleting plan resource assignment:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();