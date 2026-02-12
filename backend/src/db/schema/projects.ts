import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

/**
 * Projects table for multi-project support
 * Each project represents an internal application or service that can send messages
 */
export const projects = pgTable('projects', {
    // Unique project identifier
    id: uuid('id').defaultRandom().primaryKey(),

    // Human-readable project name (must be unique)
    name: varchar('name', { length: 255 }).notNull().unique(),

    // Optional description of the project
    description: text('description'),

    // Secret API key for authentication (auto-generated on registration)
    apiKey: text('api_key').notNull().unique(),

    // Project status: active or suspended
    status: varchar('status', { length: 50 }).notNull().default('active'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    // Index for API key lookups (used in authentication)
    apiKeyIdx: index('idx_projects_api_key').on(table.apiKey),
    // Index for status-based queries
    statusIdx: index('idx_projects_status').on(table.status),
}));

export type ProjectInsert = typeof projects.$inferInsert;
export type ProjectSelect = typeof projects.$inferSelect;
