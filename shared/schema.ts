import { pgTable, text, serial, integer, boolean, jsonb, decimal, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  sidebarCollapsed: boolean("sidebar_collapsed").notNull().default(false),
  sidebarColor: text("sidebar_color").notNull().default('default'),
  headerColor: text("header_color").notNull().default('default'),
  primaryColor: text("primary_color").notNull().default('blue'),
  autoCollapse: boolean("auto_collapse").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  href: text("href"),
  parentId: integer("parent_id"),
  order: integer("order").notNull().default(0),
});

export const dashboardStats = pgTable("dashboard_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cartCount: integer("cart_count").notNull().default(0),
  notificationCount: integer("notification_count").notNull().default(0),
  emailCount: integer("email_count").notNull().default(0),
  clientsCount: integer("clients_count").notNull().default(0),
  productsCount: integer("products_count").notNull().default(0),
  salesCount: integer("sales_count").notNull().default(0),
  suppliersCount: integer("suppliers_count").notNull().default(0),
  supportTicketsCount: integer("support_tickets_count").notNull().default(0),
  stats: jsonb("stats"),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  price: integer("price").notNull(), // in cents
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, success, error
  senderName: text("sender_name"),
  senderAvatar: text("sender_avatar"),
  serviceType: text("service_type").notNull(), // push, system, app
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sender: text("sender").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderAvatar: text("sender_avatar"),
  subject: text("subject").notNull(),
  preview: text("preview").notNull(),
  serviceType: text("service_type").notNull(), // email, whatsapp, telegram
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  image: text("image"),
  status: text("status").notNull().default("active"), // active, inactive, pending
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  image: text("image"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productGroups = pgTable("product_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  price: text("price").notNull(), // Store as string to avoid decimal issues
  costPrice: text("cost_price"),
  categoryId: integer("category_id"),
  manufacturerId: integer("manufacturer_id"),
  productGroupId: integer("product_group_id"),
  weight: text("weight"),
  dimensions: text("dimensions"), // JSON string for length, width, height
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  images: text("images").array(), // Array of image URLs
  defaultImageIndex: integer("default_image_index").default(0), // Index of default image in images array
  status: text("status").notNull().default("active"), // active, inactive, discontinued
  featured: boolean("featured").default(false),
  tags: text("tags").array(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  website: text("website"),
  cnpj: text("cnpj"),
  cpf: text("cpf"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("Brasil"),
  contactPerson: text("contact_person"),
  contactRole: text("contact_role"),
  paymentTerms: text("payment_terms"),
  deliveryTime: text("delivery_time"),
  minimumOrder: text("minimum_order"),
  categories: text("categories").array(), // Array of category IDs
  manufacturers: text("manufacturers").array(), // Array of manufacturer IDs
  productGroups: text("product_groups").array(), // Array of product group IDs
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  rating: integer("rating").default(0),
  image: text("image"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleNumber: text("sale_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  userId: integer("user_id").references(() => users.id),
  saleDate: text("sale_date").notNull(),
  status: text("status").default("pendente"), // pendente, confirmada, enviada, entregue, cancelada
  paymentMethod: text("payment_method"), // dinheiro, cartao, pix, boleto, credito
  paymentStatus: text("payment_status").default("pendente"), // pendente, pago, atrasado
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  deliveryAddress: text("delivery_address"),
  deliveryDate: text("delivery_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: text("created_at").notNull(),
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").unique().notNull(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open").notNull(), // open, in-progress, pending, resolved, closed
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  category: text("category").notNull(),
  tags: text("tags").array(),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  chatwootConversationId: integer("chatwoot_conversation_id"),
  chatwootInboxId: integer("chatwoot_inbox_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  resolvedAt: text("resolved_at"),
  firstResponseAt: text("first_response_at"),
  lastActivityAt: text("last_activity_at").notNull(),
});

// Support Ticket Messages
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  messageType: text("message_type").default("message").notNull(), // message, note, status_change
  isInternal: boolean("is_internal").default(false),
  attachments: text("attachments").array(),
  chatwootMessageId: integer("chatwoot_message_id"),
  createdAt: text("created_at").notNull(),
});

// Support Categories
export const supportCategories = pgTable("support_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Chatwoot Integration Settings
export const chatwootSettings = pgTable("chatwoot_settings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  inboxId: integer("inbox_id").notNull(),
  inboxName: text("inbox_name"),
  apiToken: text("api_token").notNull(),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(true),
  syncEnabled: boolean("sync_enabled").default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Email Accounts Management
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  provider: text("provider").notNull(), // gmail, outlook, smtp, imap
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").default(true),
  imapHost: text("imap_host"),
  imapPort: integer("imap_port"),
  imapSecure: boolean("imap_secure").default(true),
  username: text("username").notNull(),
  password: text("password").notNull(), // encrypted
  isDefault: boolean("is_default").default(false),
  status: text("status").default("active").notNull(),
  lastSync: text("last_sync"),
  syncFrequency: integer("sync_frequency").default(300), // seconds
  signature: text("signature"),
  autoReply: boolean("auto_reply").default(false),
  autoReplyMessage: text("auto_reply_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertNavigationItemSchema = createInsertSchema(navigationItems).omit({
  id: true,
});

export const insertDashboardStatsSchema = createInsertSchema(dashboardStats).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  image: z.string().optional(),
});

export const insertProductGroupSchema = createInsertSchema(productGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  firstResponseAt: true,
  lastActivityAt: true,
});

export const insertSupportTicketMessageSchema = createInsertSchema(supportTicketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSupportCategorySchema = createInsertSchema(supportCategories).omit({
  id: true,
});

export const insertChatwootSettingsSchema = createInsertSchema(chatwootSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Authentication schemas will be added later

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type DashboardStats = typeof dashboardStats.$inferSelect;
export type InsertNavigationItem = z.infer<typeof insertNavigationItemSchema>;
export type InsertDashboardStats = z.infer<typeof insertDashboardStatsSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type ProductGroup = typeof productGroups.$inferSelect;
export type InsertProductGroup = z.infer<typeof insertProductGroupSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = z.infer<typeof insertSupportTicketMessageSchema>;
export type SupportCategory = typeof supportCategories.$inferSelect;
export type InsertSupportCategory = z.infer<typeof insertSupportCategorySchema>;
export type ChatwootSettings = typeof chatwootSettings.$inferSelect;
export type InsertChatwootSettings = z.infer<typeof insertChatwootSettingsSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

// Docker Containers Table
export const dockerContainers = pgTable("docker_containers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  tag: text("tag").notNull().default("latest"),
  status: text("status").notNull().default("stopped"), // running, stopped, paused, restarting
  ports: jsonb("ports"), // Port mappings: [{"host": 8080, "container": 80}]
  volumes: jsonb("volumes"), // Volume mappings: [{"host": "/data", "container": "/app/data"}]
  environment: jsonb("environment"), // Environment variables: {"NODE_ENV": "production"}
  command: text("command"), // Override command
  description: text("description"),
  containerId: text("container_id"), // Actual Docker container ID
  networkMode: text("network_mode").default("bridge"),
  restartPolicy: text("restart_policy").default("unless-stopped"),
  cpuLimit: decimal("cpu_limit"), // CPU limit (e.g., 0.5 for 50%)
  memoryLimit: text("memory_limit"), // Memory limit (e.g., "512m", "1g")
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Docker Containers Schema
export const insertDockerContainerSchema = createInsertSchema(dockerContainers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type DockerContainer = typeof dockerContainers.$inferSelect;
export type InsertDockerContainer = z.infer<typeof insertDockerContainerSchema>;

// Webhooks Configuration Table
export const webhookConfigs = pgTable("webhook_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("POST"),
  format: text("format").notNull().default("json"), // json, form, xml
  headers: jsonb("headers"), // Custom headers as JSON object
  secretKey: text("secret_key"), // HMAC secret
  isActive: boolean("is_active").notNull().default(true),
  events: jsonb("events").notNull(), // Array of event names
  retryCount: integer("retry_count").notNull().default(3),
  timeout: integer("timeout").notNull().default(10), // seconds
  lastTest: timestamp("last_test"),
  lastTestStatus: text("last_test_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebhookConfigSchema = createInsertSchema(webhookConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTest: true,
  lastTestStatus: true,
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;

// Auth types will be added later when tables are properly defined