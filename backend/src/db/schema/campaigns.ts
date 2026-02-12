import { pgTable, text, timestamp, uuid, jsonb, varchar, index, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Campaigns table - stores WhatsApp campaign information
 */
export const campaigns = pgTable('campaigns', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this campaign
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Campaign name
    name: varchar('name', { length: 255 }).notNull(),

    // Telinfy WhatsApp Business ID (channel ID)
    channelId: text('channel_id').notNull(),

    // File ID returned from Telinfy file upload API
    fileId: text('file_id'),

    // Telinfy's campaign ID (returned after campaign creation)
    telinfyCampaignId: text('telinfy_campaign_id'),

    // Channel group ID (required by Telinfy)
    channelGroupId: integer('channel_group_id').default(3),

    // Campaign status: pending, uploading, created, processing, completed, failed
    status: varchar('status', { length: 50 }).notNull().default('pending'),

    // Number of messages in the campaign
    messageCount: integer('message_count').notNull().default(0),

    // Scheduled time for the campaign
    scheduleTime: timestamp('schedule_time'),

    // Original messages payload (stored for reference)
    messagesPayload: jsonb('messages_payload').$type<Array<Record<string, unknown>>>(),

    // Error details if failed
    error: jsonb('error').$type<Record<string, unknown> | null>(),

    // Telinfy response data
    telinfyResponse: jsonb('telinfy_response').$type<Record<string, unknown> | null>(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
}, (table) => ({
    projectIdIdx: index('idx_campaigns_project_id').on(table.projectId),
    statusIdx: index('idx_campaigns_status').on(table.status),
    createdAtIdx: index('idx_campaigns_created_at').on(table.createdAt),
    telinfyCampaignIdIdx: index('idx_campaigns_telinfy_campaign_id').on(table.telinfyCampaignId),
}));

export type CampaignInsert = typeof campaigns.$inferInsert;
export type CampaignSelect = typeof campaigns.$inferSelect;
