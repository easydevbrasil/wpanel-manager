CREATE TABLE "expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "expense_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expense_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" integer NOT NULL,
	"reminder_type" text NOT NULL,
	"reminder_date" timestamp NOT NULL,
	"message" text NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"email" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "reminder_days_before" integer DEFAULT 3;