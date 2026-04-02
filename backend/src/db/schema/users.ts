import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Users table - represents members of an organization (tenant)
 */
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // The organization this user belongs to
    orgId: uuid('org_id')
        .references(() => organizations.id, { onDelete: 'cascade' })
        .notNull(),
        
    // User's email address
    email: varchar('email', { length: 255 }).notNull().unique(),
    
    // Hashed password
    passwordHash: text('password_hash').notNull(),
    
    // Full name
    name: varchar('name', { length: 255 }).notNull(),
    
    // Role within the organization ('owner', 'admin', 'member', 'viewer')
    orgRole: varchar('org_role', { length: 50 }).notNull().default('member'),
    
    // User status
    status: varchar('status', { length: 50 }).notNull().default('active'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgIdIdx: index('idx_users_org_id').on(table.orgId),
    emailIdx: index('idx_users_email').on(table.email),
}));

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
