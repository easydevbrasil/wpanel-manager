CREATE TABLE "scheduled_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule" text NOT NULL,
	"command" text NOT NULL,
	"type" text DEFAULT 'user' NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"last_output" text,
	"last_error" text,
	"run_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"timeout" integer DEFAULT 300 NOT NULL,
	"created_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"environment" jsonb,
	"working_directory" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_execution_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL,
	"output" text,
	"error_message" text,
	"exit_code" integer,
	"duration" integer,
	"triggered_by" text DEFAULT 'schedule' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"command" text NOT NULL,
	"schedule" text NOT NULL,
	"category" text NOT NULL,
	"environment" jsonb,
	"is_system_template" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "cnpj" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_date" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "asaas_payment_id" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "asaas_customer_id" text;