import { pgTable, text, timestamp, uuid, integer, boolean, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Project Configurations table — stores per-project service credentials.
 * 
 * Each project has at most one configuration row (1:1 with projects).
 * Sensitive fields (API keys, passwords) are stored encrypted via CryptoService.
 * 
 * If a project has no configuration row, the system falls back to .env defaults.
 */
export const projectConfigurations = pgTable('project_configurations', {
    id: uuid('id').defaultRandom().primaryKey(),

    // 1:1 relationship with projects
    projectId: uuid('project_id')
        .references(() => projects.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),

    // ─── WhatsApp / Telinfy Configuration ────────────────────────────
    whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),

    // Encrypted: Telinfy API key
    telinfyApiKey: text('telinfy_api_key'),

    // WhatsApp Business Account ID on Telinfy
    telinfyWhatsappBusinessId: text('telinfy_whatsapp_business_id'),

    // ─── Email / SMTP Configuration ─────────────────────────────────
    emailEnabled: boolean('email_enabled').notNull().default(false),

    smtpHost: text('smtp_host'),
    smtpPort: integer('smtp_port'),
    smtpSecure: boolean('smtp_secure').default(true),
    smtpUser: text('smtp_user'),

    // Encrypted: SMTP password
    smtpPassword: text('smtp_password'),

    defaultFromEmail: text('default_from_email'),
    defaultFromName: text('default_from_name'),

    // ─── Email Rate Limiting & Batch Config ─────────────────────────
    emailBatchSize: integer('email_batch_size').default(100),
    emailMaxRetries: integer('email_max_retries').default(3),
    emailRateLimitMax: integer('email_rate_limit_max').default(100),
    emailRateLimitDuration: integer('email_rate_limit_duration').default(1000),

    // ─── Timestamps ─────────────────────────────────────────────────
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    projectIdIdx: index('idx_project_configurations_project_id').on(table.projectId),
}));

export type ProjectConfigInsert = typeof projectConfigurations.$inferInsert;
export type ProjectConfigSelect = typeof projectConfigurations.$inferSelect;
