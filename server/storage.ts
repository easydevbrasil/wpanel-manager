import { 
  users, 
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
  type InsertSaleItem
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
        name: "Ana Silva",
        email: "ana.silva@techsolutions.com.br",
        phone: "(11) 99999-1111",
        company: "Tech Solutions Brasil",
        position: "Diretora de TI",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
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
    const cartItems = await this.getCartItems(userId);
    const notifications = await this.getNotifications(userId);
    const emails = await this.getEmails(userId);
    
    return { 
      id: 1, 
      userId, 
      cartCount: cartItems.length, 
      notificationCount: notifications.filter(n => !n.isRead).length, 
      emailCount: emails.filter(e => !e.isRead).length, 
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
    return await db.select().from(categories).orderBy(categories.name);
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
    return await db.select().from(manufacturers).orderBy(manufacturers.name);
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
}

export const storage = new DatabaseStorage();