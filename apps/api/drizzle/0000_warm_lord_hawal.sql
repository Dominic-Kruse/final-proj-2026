CREATE TABLE "inventory_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"batch_number" varchar(100) NOT NULL,
	"supplier_id" integer,
	"expiry_date" date NOT NULL,
	"received_date" date DEFAULT now(),
	"initial_quantity" integer NOT NULL,
	"current_quantity" integer NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"selling_price" numeric(12, 2) NOT NULL,
	"status" varchar DEFAULT 'available'
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(100),
	"name" varchar(255) NOT NULL,
	"generic_name" text NOT NULL,
	"description" text,
	"category" varchar(100),
	"form" varchar(50),
	"base_unit" varchar NOT NULL,
	"package_unit" varchar,
	"conversion_factor" integer DEFAULT 1,
	"is_prescription_required" boolean DEFAULT false,
	"requires_cold_chain" boolean DEFAULT false,
	"reorder_level" integer DEFAULT 10,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer,
	"type" varchar NOT NULL,
	"quantity_changed" integer NOT NULL,
	"reason" text,
	"performed_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;