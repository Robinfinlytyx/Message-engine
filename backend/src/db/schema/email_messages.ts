import { pgTable, text, timestamp, uuid, jsonb, varchar, index, boolean, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { emailBatches } from './email_batches';
import { emailTemplates } from './email_templates';

/**
 * Email Messages table - stores all Email-specific message data
 */
export const emailMessages = pgTable('email_messages', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this message
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Recipient email address
    to: text('to').notNull(),

    // CC recipients (comma-separated or JSON array)
    cc: jsonb('cc').$type<string[] | null>(),

    // BCC recipients (comma-separated or JSON array)
    bcc: jsonb('bcc').$type<string[] | null>(),

    // Sender email (optional, may use default)
    from: text('from'),

    // Reply-to address
    replyTo: text('reply_to'),

    // Email subject
    subject: text('subject').notNull(),

    // Template name (if using templates)
    templateName: text('template_name'),

    // Template ID reference
    templateId: uuid('template_id').references(() => emailTemplates.id),

    // HTML content
    htmlContent: text('html_content'),

    // Plain text content
    textContent: text('text_content'),

    // Template variables/parameters
    templateVariables: jsonb('template_variables').$type<Record<string, unknown> | null>(),

    // Attachments metadata
    attachments: jsonb('attachments').$type<Array<{
        filename: string;
        contentType: string;
        size: number;
        url?: string;
    }> | null>(),

    // Provider name (sendgrid, ses, etc.)
    provider: varchar('provider', { length: 50 }).notNull().default('sendgrid'),

    // Provider's message ID
    providerMessageId: text('provider_message_id'),

    // Message status
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'),

    // Error details if failed
    error: jsonb('error').$type<Record<string, unknown> | null>(),

    // Tracking flags
    isOpened: boolean('is_opened').default(false),
    isClicked: boolean('is_clicked').default(false),
    isBounced: boolean('is_bounced').default(false),
    isUnsubscribed: boolean('is_unsubscribed').default(false),

    // Batch tracking
    batchId: uuid('batch_id').references(() => emailBatches.id),

    // Retry mechanism
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    nextRetryAt: timestamp('next_retry_at'),

    // Scheduled message reference (if scheduled)
    scheduledMessageId: uuid('scheduled_message_id'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
}, (table) => ({
    projectIdIdx: index('idx_email_messages_project_id').on(table.projectId),
    statusIdx: index('idx_email_messages_status').on(table.status),
    providerMessageIdIdx: index('idx_email_messages_provider_message_id').on(table.providerMessageId),
    createdAtIdx: index('idx_email_messages_created_at').on(table.createdAt),
    scheduledMessageIdIdx: index('idx_email_messages_scheduled_message_id').on(table.scheduledMessageId),
    batchIdIdx: index('idx_email_messages_batch_id').on(table.batchId),
    retryIdx: index('idx_email_messages_retry').on(table.status, table.nextRetryAt),
    templateIdIdx: index('idx_email_messages_template_id').on(table.templateId),
}));

export type EmailMessageInsert = typeof emailMessages.$inferInsert;
export type EmailMessageSelect = typeof emailMessages.$inferSelect;
