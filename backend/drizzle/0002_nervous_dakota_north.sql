CREATE TABLE "project_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"telinfy_api_key" text,
	"telinfy_whatsapp_business_id" text,
	"telinfy_access_id" text,
	"telinfy_phone_number_id" text,
	"telinfy_user_name" text,
	"telinfy_business_account_id" text,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_secure" boolean DEFAULT true,
	"smtp_user" text,
	"smtp_password" text,
	"default_from_email" text,
	"default_from_name" text,
	"email_batch_size" integer DEFAULT 100,
	"email_max_retries" integer DEFAULT 3,
	"email_rate_limit_max" integer DEFAULT 100,
	"email_rate_limit_duration" integer DEFAULT 1000,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_configurations_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
DROP INDEX "idx_whatsapp_templates_unique_name";--> statement-breakpoint
ALTER TABLE "project_configurations" ADD CONSTRAINT "project_configurations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_configurations_project_id" ON "project_configurations" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_whatsapp_templates_unique_project_name" ON "whatsapp_templates" USING btree ("project_id","name");