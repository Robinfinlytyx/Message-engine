import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Tracks pending team invitations
 */
export const invitations = pgTable('invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // The org they are being invited to
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
    
    // The user who created the invite
    invitedBy: uuid('invited_by').references(() => users.id).notNull(),
    
    // Email of the invitee
    email: varchar('email', { length: 255 }).notNull(),
    
    // Intended org role ('admin', 'member', 'viewer')
    orgRole: varchar('org_role', { length: 50 }).notNull().default('member'),
    
    // Secure token for the invite link
    token: varchar('token', { length: 255 }).notNull().unique(),
    
    // Status ('pending', 'accepted', 'expired')
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    
    // Expiration date
    expiresAt: timestamp('expires_at').notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    orgIdIdx: index('idx_invitations_org_id').on(table.orgId),
    tokenIdx: index('idx_invitations_token').on(table.token),
}));

export type InvitationInsert = typeof invitations.$inferInsert;
export type InvitationSelect = typeof invitations.$inferSelect;
