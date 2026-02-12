CREATE TABLE IF NOT EXISTS "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"to" text NOT NULL,
	"cc" jsonb,
	"bcc" jsonb,
	"from" text,
	"reply_to" text,
	"subject" text NOT NULL,
	"template_name" text,
	"html_content" text,
	"text_content" text,
	"template_variables" jsonb,
	"attachments" jsonb,
	"provider" varchar(50) DEFAULT 'sendgrid' NOT NULL,
	"provider_message_id" text,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"error" jsonb,
	"is_opened" boolean DEFAULT false,
	"is_clicked" boolean DEFAULT false,
	"is_bounced" boolean DEFAULT false,
	"is_unsubscribed" boolean DEFAULT false,
	"batch_id" uuid,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"scheduled_message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text,
	"total_emails" integer DEFAULT 0 NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"batch_size" integer DEFAULT 100 NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_batch_id_email_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."email_batches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_batches" ADD CONSTRAINT "email_batches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_project_id" ON "email_messages" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_status" ON "email_messages" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_provider_message_id" ON "email_messages" USING btree ("provider_message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_created_at" ON "email_messages" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_scheduled_message_id" ON "email_messages" USING btree ("scheduled_message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_batch_id" ON "email_messages" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_retry" ON "email_messages" USING btree ("status","next_retry_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_batches_project_id" ON "email_batches" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_batches_status" ON "email_batches" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_batches_created_at" ON "email_batches" USING btree ("created_at");