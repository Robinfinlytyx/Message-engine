import { pgTable, text, timestamp, uuid, jsonb, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const emailTemplates = pgTable('email_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    subject: text('subject').notNull(), // Template for subject
    htmlContent: text('html_content'),   // Template for HTML body
    textContent: text('text_content'),   // Template for text body
    variables: jsonb('variables').$type<string[] | null>(), // List of expected variable names
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    projectIdx: index('idx_email_templates_project').on(table.projectId),
    uniqueName: uniqueIndex('idx_email_templates_unique_name').on(table.projectId, table.name),
}));

export type EmailTemplateInsert = typeof emailTemplates.$inferInsert;
export type EmailTemplateSelect = typeof emailTemplates.$inferSelect;
