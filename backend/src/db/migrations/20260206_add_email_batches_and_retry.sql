-- Email Service Migration
-- Creates email_batches table and adds foreign key from email_messages.batch_id

-- Create email_batches table
CREATE TABLE IF NOT EXISTS "email_batches" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "projects"("id"),
    "name" TEXT,
    "total_emails" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "batch_size" INTEGER NOT NULL DEFAULT 100,
    "status" VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "completed_at" TIMESTAMP
);

-- Add indexes for email_batches
CREATE INDEX IF NOT EXISTS "idx_email_batches_project_id" ON "email_batches"("project_id");
CREATE INDEX IF NOT EXISTS "idx_email_batches_status" ON "email_batches"("status");
CREATE INDEX IF NOT EXISTS "idx_email_batches_created_at" ON "email_batches"("created_at");

-- Add foreign key constraint from email_messages.batch_id to email_batches.id
ALTER TABLE "email_messages"
ADD CONSTRAINT "fk_email_messages_batch_id" 
FOREIGN KEY ("batch_id") REFERENCES "email_batches"("id");

-- Comment on tables
COMMENT ON TABLE "email_batches" IS 'Tracks bulk email sending operations with batch status and counters';
COMMENT ON COLUMN "email_messages"."batch_id" IS 'Reference to parent batch for bulk sends';
COMMENT ON COLUMN "email_messages"."retry_count" IS 'Number of retry attempts made';
COMMENT ON COLUMN "email_messages"."max_retries" IS 'Maximum retry attempts allowed';
COMMENT ON COLUMN "email_messages"."next_retry_at" IS 'Scheduled time for next retry attempt';
