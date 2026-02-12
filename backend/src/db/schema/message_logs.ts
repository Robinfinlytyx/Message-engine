import { pgTable, text, timestamp, uuid, jsonb, varchar, index, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Message Logs table - tracks all message sending attempts and events
 * This provides a complete audit trail for debugging and analytics
 */
export const messageLogs = pgTable('message_logs', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this log entry
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Channel type (whatsapp, email, sms)
    channel: varchar('channel', { length: 50 }).notNull(),

    // Reference to the actual message (whatsapp_messages.id or email_messages.id)
    messageId: uuid('message_id').notNull(),

    // Log event type: queued, processing, sent, delivered, failed, retrying, etc.
    eventType: varchar('event_type', { length: 50 }).notNull(),

    // Previous status (for status change events)
    previousStatus: varchar('previous_status', { length: 50 }),

    // New status (for status change events)
    newStatus: varchar('new_status', { length: 50 }),

    // Event details/metadata
    details: jsonb('details').$type<Record<string, unknown> | null>(),

    // Provider response (if applicable)
    providerResponse: jsonb('provider_response').$type<Record<string, unknown> | null>(),

    // Error information (if applicable)
    error: jsonb('error').$type<{
        code?: string;
        message?: string;
        details?: unknown;
    } | null>(),

    // Retry attempt number (if this is a retry event)
    retryAttempt: integer('retry_attempt'),

    // Duration in milliseconds (for processing events)
    durationMs: integer('duration_ms'),

    // IP address or source identifier
    source: varchar('source', { length: 100 }),

    // Timestamp when this event occurred
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    projectIdIdx: index('idx_message_logs_project_id').on(table.projectId),
    messageIdIdx: index('idx_message_logs_message_id').on(table.messageId),
    channelIdx: index('idx_message_logs_channel').on(table.channel),
    eventTypeIdx: index('idx_message_logs_event_type').on(table.eventType),
    createdAtIdx: index('idx_message_logs_created_at').on(table.createdAt),
    // Composite index for efficient message history queries
    messageHistoryIdx: index('idx_message_logs_history').on(table.messageId, table.createdAt),
}));

export type MessageLogInsert = typeof messageLogs.$inferInsert;
export type MessageLogSelect = typeof messageLogs.$inferSelect;
