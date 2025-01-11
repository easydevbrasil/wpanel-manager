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
  cpf: text("cpf"),
  cnpj: text("cnpj"),
  company: text("company"),
  position: text("position"),
  image: text("image"),
  planId: integer("plan_id").references(() => plans.id), // Reference to the plan
  discountPlanId: integer("discount_plan_id").references(() => clientDiscountPlans.id), // Reference to discount plan
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

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  price: text("price").notNull(), // Store as string to avoid decimal issues
  categoryId: integer("category_id"),
  duration: text("duration"), // Duration in minutes, hours, days, etc.
  durationType: text("duration_type").default("hours"), // minutes, hours, days, weeks, months
  requiresBooking: boolean("requires_booking").default(false),
  maxBookingsPerDay: integer("max_bookings_per_day"),
  images: text("images").array(), // Array of image URLs
  defaultImageIndex: integer("default_image_index").default(0),
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

// Service Providers table (for expenses)
export const providers = pgTable("providers", {
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
  serviceType: text("service_type"), // "hosting", "domain", "software", "marketing", etc.
  categories: text("categories").array(), // Array of service categories
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  rating: integer("rating").default(0),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  paymentDate: text("payment_date"),
  asaasPaymentId: text("asaas_payment_id"),
  asaasCustomerId: text("asaas_customer_id"),
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

export const insertProviderSchema = createInsertSchema(providers).omit({
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
}).extend({
  password: z.string().min(1, "Senha é obrigatória"),
  username: z.string().optional(),
  provider: z.string().optional(),
});

// Sessions Table for Authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").unique(),
  expiresAt: timestamp("expires_at").notNull(),
  refreshExpiresAt: timestamp("refresh_expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Addresses Table for User Profile
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("Brasil"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
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
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

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

// Task Scheduler Tables
export const scheduledTasks = pgTable("scheduled_tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  schedule: text("schedule").notNull(), // Cron expression
  command: text("command").notNull(),
  type: text("type").notNull().default("user"), // user, system
  category: text("category").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, running, error
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  lastOutput: text("last_output"),
  lastError: text("last_error"),
  runCount: integer("run_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  timeout: integer("timeout").notNull().default(300), // seconds
  createdBy: integer("created_by"), // user id
  isActive: boolean("is_active").notNull().default(true),
  environment: jsonb("environment"), // Environment variables for the task
  workingDirectory: text("working_directory"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskExecutionLogs = pgTable("task_execution_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // success, error, timeout, cancelled
  output: text("output"),
  errorMessage: text("error_message"),
  exitCode: integer("exit_code"),
  duration: integer("duration"), // milliseconds
  triggeredBy: text("triggered_by").notNull().default("schedule"), // schedule, manual, api
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  command: text("command").notNull(),
  schedule: text("schedule").notNull(),
  category: text("category").notNull(),
  environment: jsonb("environment"),
  isSystemTemplate: boolean("is_system_template").notNull().default(false),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Scheduler Schemas
export const insertScheduledTaskSchema = createInsertSchema(scheduledTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true,
  runCount: true,
  errorCount: true,
});

export const insertTaskExecutionLogSchema = createInsertSchema(taskExecutionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = z.infer<typeof insertScheduledTaskSchema>;
export type TaskExecutionLog = typeof taskExecutionLogs.$inferSelect;
export type InsertTaskExecutionLog = z.infer<typeof insertTaskExecutionLogSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

// Expense Reminders table
export const expenseReminders = pgTable("expense_reminders", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull(),
  reminderType: text("reminder_type").notNull(), // "before_due", "recurring", "payment_due"
  reminderDate: timestamp("reminder_date").notNull(),
  message: text("message").notNull(),
  sent: boolean("sent").notNull().default(false),
  email: text("email"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  amountConverted: decimal("amount_converted", { precision: 10, scale: 2 }), // Valor sempre em BRL
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // Valor na moeda original
  currency: text("currency").notNull().default("BRL"), // BRL, USD, EUR, etc
  category: text("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  dueDate: timestamp("due_date"), // Data de vencimento para agendamento
  scheduledDate: timestamp("scheduled_date"), // Data agendada para pagamento
  notes: text("notes"),
  paymentMethod: text("payment_method").notNull(),
  providerId: integer("provider_id"), // Vinculação com prestador de serviços
  recurring: boolean("recurring").notNull().default(false),
  recurringPeriod: text("recurring_period"), // "monthly", "yearly"
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderDaysBefore: integer("reminder_days_before").default(3),
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates table for currency conversion
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(), // USD, EUR, etc
  toCurrency: text("to_currency").notNull().default("BRL"), // Sempre BRL como base
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(), // Taxa de câmbio
  date: timestamp("date").defaultNow().notNull(), // Data da cotação
  source: text("source").default("external_api"), // Fonte da cotação
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expense categories table for dynamic category management
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").default("FileText"), // Nome do ícone do Lucide
  color: text("color").default("#6B7280"), // Cor hex para o ícone
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").default("CreditCard"), // Nome do ícone do Lucide
  color: text("color").default("#6B7280"), // Cor hex para o ícone
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseReminderSchema = createInsertSchema(expenseReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseCategoriesSchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodsSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Container Logos Table
export const containerLogos = pgTable("container_logos", {
  id: serial("id").primaryKey(),
  containerId: text("container_id").notNull().unique(), // Docker container ID
  logoUrl: text("logo_url").notNull(), // URL/path to the logo image
  originalName: text("original_name"), // Original container name for reference
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Logs Table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(), // error, warning, info, success, security, system, user, api
  category: text("category").notNull(), // authentication, database, docker, etc
  message: text("message").notNull(),
  details: jsonb("details"), // Additional structured data
  userId: integer("user_id"), // Foreign key to users (optional)
  userEmail: text("user_email"), // Cached user email for historical purposes
  ipAddress: text("ip_address"), // Client IP
  userAgent: text("user_agent"), // Client user agent
  action: text("action"), // Action performed (CREATE, UPDATE, DELETE, etc)
  resource: text("resource"), // Resource affected (user, product, etc)
  resourceId: text("resource_id"), // ID of affected resource
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

export const insertContainerLogosSchema = createInsertSchema(containerLogos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Settings table for storing service configurations
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., 'asaas_config', 'cloudflare_config', 'evolution_config'
  value: jsonb("value").notNull(), // JSON object with the configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Plans table for subscription plans
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Carbon, Bronze, Gold, Platinum, etc.
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("BRL"),
  billingPeriod: text("billing_period").notNull().default("monthly"), // monthly, quarterly, annually, custom
  features: jsonb("features"), // JSON array of features included in the plan
  limitations: jsonb("limitations"), // JSON object with plan limitations (storage, users, etc.)
  color: text("color").notNull().default("#6b7280"), // Hex color for the plan gradient
  gradient: text("gradient").notNull().default("linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"), // CSS gradient
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false), // Only one plan should be default
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment method discounts for plans
export const planPaymentDiscounts = pgTable("plan_payment_discounts", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(), // PIX, cartao_credito, cartao_debito, boleto, dinheiro
  discountType: text("discount_type").notNull().default("percentage"), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription periods discounts (for longer commitments)
export const planSubscriptionDiscounts = pgTable("plan_subscription_discounts", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  subscriptionPeriod: text("subscription_period").notNull(), // 3_months, 6_months, 12_months, 24_months
  discountType: text("discount_type").notNull().default("percentage"), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plan resources table
export const planResources = pgTable("plan_resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(), // Could be boolean (true/false), numeric (GB, users), or text
  image: text("image"), // URL or path to resource icon/image
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for plan-resource relationships
export const planResourceAssignments = pgTable("plan_resource_assignments", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  resourceId: integer("resource_id").notNull().references(() => planResources.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  customValue: text("custom_value"), // Override the default resource value for this plan
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client discount plans (Carbon, Bronze, Gold, Platinum, Diamond)
export const clientDiscountPlans = pgTable("client_discount_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Carbon, Bronze, Gold, Platinum, Diamond
  description: text("description"),
  gradient: text("gradient").notNull(), // CSS gradient for the plan color
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discount rules for each plan and payment method
export const clientDiscountRules = pgTable("client_discount_rules", {
  id: serial("id").primaryKey(),
  discountPlanId: integer("discount_plan_id").notNull().references(() => clientDiscountPlans.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(), // cash, credit, debit, pix, etc.
  discountType: text("discount_type").notNull().default("percentage"), // percentage or fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // percentage (0-100) or fixed amount in cents
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }), // minimum order value to apply discount
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }), // maximum discount amount when using percentage
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlansSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanPaymentDiscountsSchema = createInsertSchema(planPaymentDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanSubscriptionDiscountsSchema = createInsertSchema(planSubscriptionDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanResourcesSchema = createInsertSchema(planResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanResourceAssignmentsSchema = createInsertSchema(planResourceAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientDiscountPlansSchema = createInsertSchema(clientDiscountPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientDiscountRulesSchema = createInsertSchema(clientDiscountRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type ExpenseReminder = typeof expenseReminders.$inferSelect;
export type InsertExpenseReminder = z.infer<typeof insertExpenseReminderSchema>;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategoriesSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodsSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ContainerLogo = typeof containerLogos.$inferSelect;
export type InsertContainerLogo = z.infer<typeof insertContainerLogosSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlansSchema>;

export type PlanPaymentDiscount = typeof planPaymentDiscounts.$inferSelect;
export type InsertPlanPaymentDiscount = z.infer<typeof insertPlanPaymentDiscountsSchema>;

export type PlanSubscriptionDiscount = typeof planSubscriptionDiscounts.$inferSelect;
export type InsertPlanSubscriptionDiscount = z.infer<typeof insertPlanSubscriptionDiscountsSchema>;

export type PlanResource = typeof planResources.$inferSelect;
export type InsertPlanResource = z.infer<typeof insertPlanResourcesSchema>;

export type PlanResourceAssignment = typeof planResourceAssignments.$inferSelect;
export type InsertPlanResourceAssignment = z.infer<typeof insertPlanResourceAssignmentsSchema>;

export type ClientDiscountPlan = typeof clientDiscountPlans.$inferSelect;
export type InsertClientDiscountPlan = z.infer<typeof insertClientDiscountPlansSchema>;

export type ClientDiscountRule = typeof clientDiscountRules.$inferSelect;
export type InsertClientDiscountRule = z.infer<typeof insertClientDiscountRulesSchema>;

// Auth types will be added later when tables are properly defined