CREATE TABLE "whatsapp_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"language" varchar(10) NOT NULL,
	"category" varchar(50),
	"status" varchar(50) NOT NULL,
	"components" jsonb,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"subject" text NOT NULL,
	"html_content" text,
	"text_content" text,
	"variables" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_messages" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_whatsapp_templates_project" ON "whatsapp_templates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_templates_name" ON "whatsapp_templates" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_whatsapp_templates_unique_name" ON "whatsapp_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_email_templates_project" ON "email_templates" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_email_templates_unique_name" ON "email_templates" USING btree ("project_id","name");--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_messages_template_id" ON "email_messages" USING btree ("template_id");