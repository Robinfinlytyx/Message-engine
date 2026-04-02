import { pgTable, timestamp, uuid, varchar, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

/**
 * Junction table associating users with specific projects
 * Allows fine-grained access control within an organization
 */
export const userProjectAssignments = pgTable('user_project_assignments', {
    // Foreign keys
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    
    // Role within this specific project ('manager', 'viewer')
    projectRole: varchar('project_role', { length: 50 }).notNull().default('viewer'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.projectId] }),
    userIdIdx: index('idx_user_project_userId').on(table.userId),
    projectIdIdx: index('idx_user_project_projectId').on(table.projectId),
}));

export type UserProjectAssignmentInsert = typeof userProjectAssignments.$inferInsert;
export type UserProjectAssignmentSelect = typeof userProjectAssignments.$inferSelect;
