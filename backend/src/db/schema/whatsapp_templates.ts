import { pgTable, text, timestamp, uuid, varchar, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const whatsappTemplates = pgTable('whatsapp_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    language: varchar('language', { length: 10 }).notNull(),
    category: varchar('category', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull(),
    components: jsonb('components'),
    rawData: jsonb('raw_data'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    projectIdx: index('idx_whatsapp_templates_project').on(table.projectId),
    nameIdx: index('idx_whatsapp_templates_name').on(table.name),
    uniqueName: uniqueIndex('idx_whatsapp_templates_unique_name').on(table.name),
}));
