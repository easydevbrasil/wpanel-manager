CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"payment_method" text NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"recurring_period" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
