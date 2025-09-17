CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text DEFAULT 'BRL' NOT NULL,
	"rate" numeric(10, 6) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'external_api',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'CreditCard',
	"color" text DEFAULT '#6B7280',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"price" text NOT NULL,
	"category_id" integer,
	"duration" text,
	"duration_type" text DEFAULT 'hours',
	"requires_booking" boolean DEFAULT false,
	"max_bookings_per_day" integer,
	"images" text[],
	"default_image_index" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"featured" boolean DEFAULT false,
	"tags" text[],
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "services_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "expense_categories" ALTER COLUMN "icon" SET DEFAULT 'FileText';--> statement-breakpoint
ALTER TABLE "expense_categories" ALTER COLUMN "icon" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_categories" ALTER COLUMN "color" SET DEFAULT '#6B7280';--> statement-breakpoint
ALTER TABLE "expense_categories" ALTER COLUMN "color" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "amount_converted" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "original_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "currency" text DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_categories" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "expense_categories" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "subcategory";