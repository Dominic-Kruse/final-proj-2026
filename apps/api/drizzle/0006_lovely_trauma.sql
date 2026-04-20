CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" integer NOT NULL,
	"performed_by" varchar(255),
	"old_values" text,
	"new_values" text,
	"ip_address" varchar(100),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
