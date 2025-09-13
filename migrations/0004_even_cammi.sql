ALTER TABLE "expenses" ADD COLUMN "scheduled_date" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "supplier_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;