import { pgTable, text, timestamp, uuid, jsonb, varchar, integer, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Email Batches table - tracks bulk email sending operations
 */
export const emailBatches = pgTable('email_batches', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Project that owns this batch
    projectId: uuid('project_id').references(() => projects.id).notNull(),

    // Batch name (user-defined or auto-generated)
    name: text('name'),

    // Counters
    totalEmails: integer('total_emails').notNull().default(0),
    processedCount: integer('processed_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),

    // Batch configuration
    batchSize: integer('batch_size').notNull().default(100),

    // Status
    status: varchar('status', { length: 50 }).notNull().default('QUEUED'),

    // Custom metadata for tracking
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
}, (table) => ({
    projectIdIdx: index('idx_email_batches_project_id').on(table.projectId),
    statusIdx: index('idx_email_batches_status').on(table.status),
    createdAtIdx: index('idx_email_batches_created_at').on(table.createdAt),
}));

export type EmailBatchInsert = typeof emailBatches.$inferInsert;
export type EmailBatchSelect = typeof emailBatches.$inferSelect;
