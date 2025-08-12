CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text,
	"price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatwoot_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"inbox_id" integer NOT NULL,
	"inbox_name" text,
	"api_token" text NOT NULL,
	"webhook_url" text,
	"is_active" boolean DEFAULT true,
	"sync_enabled" boolean DEFAULT true,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"position" text,
	"image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dashboard_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cart_count" integer DEFAULT 0 NOT NULL,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"email_count" integer DEFAULT 0 NOT NULL,
	"clients_count" integer DEFAULT 0 NOT NULL,
	"products_count" integer DEFAULT 0 NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"suppliers_count" integer DEFAULT 0 NOT NULL,
	"support_tickets_count" integer DEFAULT 0 NOT NULL,
	"stats" jsonb
);
--> statement-breakpoint
CREATE TABLE "docker_containers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"tag" text DEFAULT 'latest' NOT NULL,
	"status" text DEFAULT 'stopped' NOT NULL,
	"ports" jsonb,
	"volumes" jsonb,
	"environment" jsonb,
	"command" text,
	"description" text,
	"container_id" text,
	"network_mode" text DEFAULT 'bridge',
	"restart_policy" text DEFAULT 'unless-stopped',
	"cpu_limit" numeric,
	"memory_limit" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"provider" text NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_secure" boolean DEFAULT true,
	"imap_host" text,
	"imap_port" integer,
	"imap_secure" boolean DEFAULT true,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync" text,
	"sync_frequency" integer DEFAULT 300,
	"signature" text,
	"auto_reply" boolean DEFAULT false,
	"auto_reply_message" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "email_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sender" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_avatar" text,
	"subject" text NOT NULL,
	"preview" text NOT NULL,
	"service_type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"href" text,
	"parent_id" integer,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"sender_name" text,
	"sender_avatar" text,
	"service_type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"barcode" text,
	"price" text NOT NULL,
	"cost_price" text,
	"category_id" integer,
	"manufacturer_id" integer,
	"product_group_id" integer,
	"weight" text,
	"dimensions" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0,
	"max_stock" integer,
	"images" text[],
	"default_image_index" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"featured" boolean DEFAULT false,
	"tags" text[],
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer,
	"product_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0.00',
	"total" numeric(10, 2) NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_number" text NOT NULL,
	"client_id" integer,
	"user_id" integer,
	"sale_date" text NOT NULL,
	"status" text DEFAULT 'pendente',
	"payment_method" text,
	"payment_status" text DEFAULT 'pendente',
	"subtotal" numeric(10, 2) DEFAULT '0.00',
	"discount" numeric(10, 2) DEFAULT '0.00',
	"tax" numeric(10, 2) DEFAULT '0.00',
	"shipping" numeric(10, 2) DEFAULT '0.00',
	"total" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"delivery_address" text,
	"delivery_date" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"refresh_expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"website" text,
	"cnpj" text,
	"cpf" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'Brasil',
	"contact_person" text,
	"contact_role" text,
	"payment_terms" text,
	"delivery_time" text,
	"minimum_order" text,
	"categories" text[],
	"manufacturers" text[],
	"product_groups" text[],
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"rating" integer DEFAULT 0,
	"image" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" integer,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'message' NOT NULL,
	"is_internal" boolean DEFAULT false,
	"attachments" text[],
	"chatwoot_message_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_number" text NOT NULL,
	"client_id" integer,
	"user_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text NOT NULL,
	"tags" text[],
	"assigned_to" integer,
	"chatwoot_conversation_id" integer,
	"chatwoot_inbox_id" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"resolved_at" text,
	"first_response_at" text,
	"last_activity_at" text NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"street" text,
	"number" text,
	"complement" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'Brasil',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_addresses_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"sidebar_color" text DEFAULT 'default' NOT NULL,
	"header_color" text DEFAULT 'default' NOT NULL,
	"primary_color" text DEFAULT 'blue' NOT NULL,
	"auto_collapse" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"avatar" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "webhook_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"method" text DEFAULT 'POST' NOT NULL,
	"format" text DEFAULT 'json' NOT NULL,
	"headers" jsonb,
	"secret_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"events" jsonb NOT NULL,
	"retry_count" integer DEFAULT 3 NOT NULL,
	"timeout" integer DEFAULT 10 NOT NULL,
	"last_test" timestamp,
	"last_test_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;