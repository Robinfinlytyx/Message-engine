import { pgTable, text, timestamp, uuid, jsonb, varchar, index } from 'drizzle-orm/pg-core';

export const webhookEvents = pgTable('webhook_events', {
    id: uuid('id').defaultRandom().primaryKey(),

    // NEW: Channel type (whatsapp, email, sms, push)
    channel: varchar('channel', { length: 50 }).notNull().default('whatsapp'),

    // Provider name (telinfy, sendgrid, twilio)
    provider: text('provider').notNull().default('telinfy'),

    // Event type (messages, statuses, errors, bounces, etc.)
    eventType: text('event_type').notNull(),

    // Complete webhook payload
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),

    // When webhook was received
    receivedAt: timestamp('received_at').defaultNow().notNull(),
}, (table) => ({
    // Index for querying by channel and provider
    channelProviderIdx: index('idx_webhook_events_channel_provider').on(table.channel, table.provider),
    // Index for time-based queries
    receivedAtIdx: index('idx_webhook_events_received_at').on(table.receivedAt),
}));

export type WebhookEventInsert = typeof webhookEvents.$inferInsert;
export type WebhookEventSelect = typeof webhookEvents.$inferSelect;
