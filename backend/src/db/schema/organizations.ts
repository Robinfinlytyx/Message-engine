import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

/**
 * Organizations table for multi-tenant SaaS support
 * Each organization represents a tenant (company/client)
 */
export const organizations = pgTable('organizations', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Org name
    name: varchar('name', { length: 255 }).notNull(),
    
    // Slug for clean URLs or programmatic access, unique
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    
    // Subscription plan (e.g., 'free', 'starter', 'pro', 'enterprise')
    plan: varchar('plan', { length: 50 }).notNull().default('free'),
    
    // Status (active, suspended)
    status: varchar('status', { length: 50 }).notNull().default('active'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    slugIdx: index('idx_organizations_slug').on(table.slug),
    statusIdx: index('idx_organizations_status').on(table.status),
}));

export type OrganizationInsert = typeof organizations.$inferInsert;
export type OrganizationSelect = typeof organizations.$inferSelect;
