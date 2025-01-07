CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"level" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"user_id" integer,
	"user_email" text,
	"ip_address" text,
	"user_agent" text,
	"action" text,
	"resource" text,
	"resource_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "container_logos" (
	"id" serial PRIMARY KEY NOT NULL,
	"container_id" text NOT NULL,
	"logo_url" text NOT NULL,
	"original_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "container_logos_container_id_unique" UNIQUE("container_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
