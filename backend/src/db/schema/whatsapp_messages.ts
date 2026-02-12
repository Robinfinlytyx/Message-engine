import { pgTable, text, timestamp, uuid, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * WhatsApp Messages table - stores all WhatsApp-specific message data
 */
export const whatsappMessages = pgTable('whatsapp_messages', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this message
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Recipient phone number
    to: text('to').notNull(),

    // Template name
    templateName: text('template_name').notNull(),

    // Language code (e.g., 'en', 'hi')
    language: varchar('language', { length: 10 }).notNull(),

    // Template header parameters
    header: jsonb('header').$type<Record<string, unknown> | null>(),

    // Template body parameters
    body: jsonb('body').$type<Record<string, unknown> | null>(),

    // Template button parameters
    button: jsonb('button').$type<Record<string, unknown>[] | null>(),

    // Complete request payload sent to provider
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),

    // Provider name (telinfy, etc.)
    provider: varchar('provider', { length: 50 }).notNull().default('telinfy'),

    // Provider's message ID (wamId)
    providerMessageId: text('provider_message_id'),

    // Message status
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'),

    // Error details if failed
    error: jsonb('error').$type<Record<string, unknown> | null>(),

    // Scheduled message reference (if scheduled)
    scheduledMessageId: uuid('scheduled_message_id'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    readAt: timestamp('read_at'),
}, (table) => ({
    projectIdIdx: index('idx_whatsapp_messages_project_id').on(table.projectId),
    statusIdx: index('idx_whatsapp_messages_status').on(table.status),
    providerMessageIdIdx: index('idx_whatsapp_messages_provider_message_id').on(table.providerMessageId),
    createdAtIdx: index('idx_whatsapp_messages_created_at').on(table.createdAt),
    scheduledMessageIdIdx: index('idx_whatsapp_messages_scheduled_message_id').on(table.scheduledMessageId),
}));

export type WhatsAppMessageInsert = typeof whatsappMessages.$inferInsert;
export type WhatsAppMessageSelect = typeof whatsappMessages.$inferSelect;
