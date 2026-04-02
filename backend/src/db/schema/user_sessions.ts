import { pgTable, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

/**
 * User Sessions table - tracks refresh tokens for both standard users and super admins
 */
export const userSessions = pgTable('user_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Polymorphic reference (either a user.id or super_admin.id)
    userId: uuid('user_id').notNull(),
    
    // Represents the type of user ('user' or 'super_admin')
    userType: varchar('user_type', { length: 50 }).notNull().default('user'),
    
    // Refresh token value
    refreshToken: varchar('refresh_token', { length: 512 }).notNull().unique(),
    
    // When the session expires
    expiresAt: timestamp('expires_at').notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('idx_user_sessions_user_id').on(table.userId),
    tokenIdx: index('idx_user_sessions_token').on(table.refreshToken),
}));

export type UserSessionInsert = typeof userSessions.$inferInsert;
export type UserSessionSelect = typeof userSessions.$inferSelect;
