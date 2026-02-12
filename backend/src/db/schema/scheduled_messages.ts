import { pgTable, text, timestamp, uuid, jsonb, varchar, index, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Scheduled Messages table - stores messages that are scheduled for future delivery
 */
export const scheduledMessages = pgTable('scheduled_messages', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this scheduled message
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Channel type (whatsapp, email, sms)
    channel: varchar('channel', { length: 50 }).notNull(),

    // Recipient (phone number, email, etc.)
    to: text('to').notNull(),

    // Scheduled time for sending
    scheduledAt: timestamp('scheduled_at').notNull(),

    // Complete message payload (channel-specific)
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),

    // Status: pending, processing, completed, failed, cancelled
    status: varchar('status', { length: 50 }).notNull().default('pending'),

    // Reference to the actual message once sent
    messageId: uuid('message_id'),

    // Retry configuration
    maxRetries: integer('max_retries').default(3),
    retryCount: integer('retry_count').default(0),

    // Error details if failed
    error: jsonb('error').$type<Record<string, unknown> | null>(),

    // Recurring schedule (cron expression, if recurring)
    cronExpression: varchar('cron_expression', { length: 100 }),

    // Reference to parent scheduled message (for recurring)
    parentScheduledId: uuid('parent_scheduled_id'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
    completedAt: timestamp('completed_at'),
}, (table) => ({
    projectIdIdx: index('idx_scheduled_messages_project_id').on(table.projectId),
    statusIdx: index('idx_scheduled_messages_status').on(table.status),
    scheduledAtIdx: index('idx_scheduled_messages_scheduled_at').on(table.scheduledAt),
    channelIdx: index('idx_scheduled_messages_channel').on(table.channel),
    // Composite index for efficient polling of pending messages
    pendingIdx: index('idx_scheduled_messages_pending').on(table.status, table.scheduledAt),
}));

export type ScheduledMessageInsert = typeof scheduledMessages.$inferInsert;
export type ScheduledMessageSelect = typeof scheduledMessages.$inferSelect;
