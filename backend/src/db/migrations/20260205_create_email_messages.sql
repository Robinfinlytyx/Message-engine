-- Email Messages table creation
-- Stores all Email-specific message data

CREATE TABLE IF NOT EXISTS "email_messages" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Project that owns this message
    "project_id" UUID NOT NULL REFERENCES "projects"("id"),
    
    -- Recipient email address
    "to" TEXT NOT NULL,
    
    -- CC recipients (JSON array)
    "cc" JSONB,
    
    -- BCC recipients (JSON array)
    "bcc" JSONB,
    
    -- Sender email (optional, may use default)
    "from" TEXT,
    
    -- Reply-to address
    "reply_to" TEXT,
    
    -- Email subject
    "subject" TEXT NOT NULL,
    
    -- Template name (if using templates)
    "template_name" TEXT,
    
    -- HTML content
    "html_content" TEXT,
    
    -- Plain text content
    "text_content" TEXT,
    
    -- Template variables/parameters
    "template_variables" JSONB,
    
    -- Attachments metadata
    "attachments" JSONB,
    
    -- Provider name (nodemailer, sendgrid, ses, etc.)
    "provider" VARCHAR(50) NOT NULL DEFAULT 'sendgrid',
    
    -- Provider's message ID
    "provider_message_id" TEXT,
    
    -- Message status
    "status" VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    
    -- Error details if failed
    "error" JSONB,
    
    -- Tracking flags
    "is_opened" BOOLEAN DEFAULT FALSE,
    "is_clicked" BOOLEAN DEFAULT FALSE,
    "is_bounced" BOOLEAN DEFAULT FALSE,
    "is_unsubscribed" BOOLEAN DEFAULT FALSE,
    
    -- Batch tracking
    "batch_id" UUID,
    
    -- Retry mechanism
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP,
    
    -- Scheduled message reference (if scheduled)
    "scheduled_message_id" UUID,
    
    -- Timestamps
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "sent_at" TIMESTAMP,
    "delivered_at" TIMESTAMP,
    "opened_at" TIMESTAMP,
    "clicked_at" TIMESTAMP
);

-- Add indexes for email_messages
CREATE INDEX IF NOT EXISTS "idx_email_messages_project_id" ON "email_messages"("project_id");
CREATE INDEX IF NOT EXISTS "idx_email_messages_status" ON "email_messages"("status");
CREATE INDEX IF NOT EXISTS "idx_email_messages_provider_message_id" ON "email_messages"("provider_message_id");
CREATE INDEX IF NOT EXISTS "idx_email_messages_created_at" ON "email_messages"("created_at");
CREATE INDEX IF NOT EXISTS "idx_email_messages_scheduled_message_id" ON "email_messages"("scheduled_message_id");
CREATE INDEX IF NOT EXISTS "idx_email_messages_batch_id" ON "email_messages"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_email_messages_retry" ON "email_messages"("status", "next_retry_at");

-- Comment on table
COMMENT ON TABLE "email_messages" IS 'Stores all Email-specific message data for the communication engine';
