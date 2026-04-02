import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

/**
 * Super Admins table - represents platform-level administrators
 * Not tied to any organization (tenant)
 */
export const superAdmins = pgTable('super_admins', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Super Admin email address
    email: varchar('email', { length: 255 }).notNull().unique(),
    
    // Hashed password
    passwordHash: text('password_hash').notNull(),
    
    // Full name
    name: varchar('name', { length: 255 }).notNull(),
    
    // Admin status
    status: varchar('status', { length: 50 }).notNull().default('active'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    emailIdx: index('idx_super_admins_email').on(table.email),
    statusIdx: index('idx_super_admins_status').on(table.status),
}));

export type SuperAdminInsert = typeof superAdmins.$inferInsert;
export type SuperAdminSelect = typeof superAdmins.$inferSelect;
