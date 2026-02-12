import { pgTable, text, timestamp, uuid, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this message (for multi-project support)
    projectId: uuid('project_id').references(() => projects.id),

    // NEW: Channel type (whatsapp, email, sms, push)
    channel: varchar('channel', { length: 50 }).notNull().default('whatsapp'),

    // Provider name (telinfy, sendgrid, twilio, etc.)
    provider: text('provider').notNull().default('telinfy'),

    // Recipient (phone number for WhatsApp/SMS, email for email)
    to: text('to').notNull(),

    // Template name (if using templates)
    templateName: text('template_name'),

    // Language code
    language: text('language'),

    // Complete request payload
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),

    // Provider's message ID (wamId, messageId, etc.)
    providerMessageId: text('provider_message_id'),

    // Message status
    status: text('status').notNull().default('QUEUED'),

    // Error details if failed
    error: jsonb('error').$type<Record<string, unknown> | null>(),

    // NEW: Channel-specific metadata
    channelSpecificData: jsonb('channel_specific_data').$type<Record<string, unknown> | null>(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    // Index for querying by channel and status
    channelStatusIdx: index('idx_messages_channel_status').on(table.channel, table.status),
    // Index for provider message ID lookups
    providerMessageIdIdx: index('idx_messages_provider_message_id').on(table.providerMessageId),
    // Index for time-based queries
    createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
    // Index for project-based queries
    projectIdIdx: index('idx_messages_project_id').on(table.projectId),
}));

export type MessageInsert = typeof messages.$inferInsert;
export type MessageSelect = typeof messages.$inferSelect;
