CREATE TABLE "providers" (
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
	"service_type" text,
	"categories" text[],
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"rating" integer DEFAULT 0,
	"image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "provider_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "supplier_id";