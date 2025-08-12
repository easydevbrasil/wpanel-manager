import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql, desc, asc, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

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
  suppliers,
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
  type Supplier,
  type InsertSupplier,
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
  type InsertUserAddress
} from "@shared/schema";

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

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
  // private sessions: Map<string, any> = new Map(); // Removed in-memory session management

  constructor() {
    this.init();
  }

  private async init() {
    await this.initializeData();
    await this.createAdminUser();
  }

  private async createAdminUser() {
    try {
      // Always try to create admin user since you deleted all users
      console.log('Creating admin user with credentials: admin / admin123');

      const hashedPassword = await argon2.hash('admin123');

      const [newUser] = await db
        .insert(users)
        .values({
          username: 'admin',
          password: hashedPassword,
          name: 'Administrator',
          role: 'Admin',
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
        })
        .returning();

      console.log('Admin user created successfully:', newUser.username);
      // Create default permissions for the newly created admin user
      this.createDefaultPermissionsForUser(newUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      // If user already exists, just log it
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('Admin user already exists');
      }
    }
  }

  private async initializeData() {
    // Database initialization - all data is now stored in PostgreSQL
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
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
      { label: "Permissões", icon: "Shield", href: "/user-permissions", order: 9, parentId: null },
      { label: "Perfil", icon: "User", href: "/user-profile", order: 10, parentId: null },
      { label: "Ajuda", icon: "HelpCircle", href: "/help", order: 11, parentId: null },
      { label: "Containers Docker", icon: "Container", href: "/containers", order: 12, parentId: null }
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

      // Verify password using Argon2
      const isValid = await argon2.verify(user.password, password);
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

      // Hash tokens for storage
      const sessionHash = await argon2.hash(sessionToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours

      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

      try {
        await db.insert(sessions).values({
          userId: user.id,
          token: sessionHash,
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
          avatar: user.avatar
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
      console.log('Validating session token');

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

        console.log(`Found ${activeSessions.length} active sessions in database`);

        // Find matching session by comparing hashed tokens
        let matchingSession = null;
        for (const session of activeSessions) {
          try {
            const isValid = await argon2.verify(session.token, sessionToken);
            if (isValid) {
              matchingSession = session;
              break;
            }
          } catch (error) {
            console.log('Error verifying session token:', error);
            continue;
          }
        }

        if (matchingSession) {
          console.log('Session validated successfully for user:', matchingSession.userId);

          // Get user information
          const [user] = await db.select()
            .from(users)
            .where(eq(users.id, matchingSession.userId))
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
        const allSessions = await db.select()
          .from(sessions);

        // Find and delete matching session
        for (const session of allSessions) {
          try {
            const isValid = await argon2.verify(session.token, sessionToken);
            if (isValid) {
              await db.delete(sessions).where(eq(sessions.id, session.id));
              console.log('Session invalidated successfully from database');
              return;
            }
          } catch (error) {
            continue;
          }
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
        productImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
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
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Category CRUD operations
  async getCategories(): Promise<Category[]> {
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
  async getManufacturers(): Promise<Manufacturer[]> {
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

  // Sales CRUD operations
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(sales.saleDate);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
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
          password: hashedPassword,
          isDefault: isFirstAccount || data.isDefault,
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

      updateData.updatedAt = new Date().toISOString();

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
}

export const storage = new DatabaseStorage();