import { db } from '../db/db';
import { whatsappTemplates } from '../db/schema/whatsapp_templates';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { providerFactory } from '../providers/provider.factory';
import { logger } from '../utils/logger';
import { eq, and, desc, sql } from 'drizzle-orm';
import { WhatsAppTemplate } from '../types';

export class WhatsAppService {
    /**
     * Sync templates from Telinfy to local DB for a specific project.
     * Now uses the project's own Telinfy credentials via ProviderFactory.
     */
    async syncTemplates(projectId: string): Promise<WhatsAppTemplate[]> {
        logger.info(`Syncing templates for project ${projectId}`);
        try {
            const telinfyProvider = await providerFactory.getTelinfyProvider(projectId);
            const templates = await telinfyProvider.getTemplates();

            // Upsert templates
            for (const tpl of templates) {
                await db.insert(whatsappTemplates).values({
                    projectId,
                    name: tpl.name,
                    language: tpl.language,
                    category: tpl.category,
                    status: tpl.status,
                    components: tpl.components,
                    rawData: tpl as any,
                }).onConflictDoUpdate({
                    target: [whatsappTemplates.projectId, whatsappTemplates.name],
                    set: {
                        status: tpl.status,
                        components: tpl.components,
                        rawData: tpl as any,
                        updatedAt: new Date(),
                    }
                });
            }

            return templates;
        } catch (error) {
            logger.error('Failed to sync templates', { projectId, error });
            throw error;
        }
    }

    /**
     * Create a new template using the project's Telinfy credentials.
     */
    async createTemplate(projectId: string, data: any): Promise<any> {
        logger.info(`Creating template for project ${projectId}`, { name: data.name });
        try {
            const telinfyProvider = await providerFactory.getTelinfyProvider(projectId);

            const payload: Record<string, any> = {
                name: data.name,
                category: data.category,
                language: data.language,
                label: data.label || data.name,
                components: data.components || []
            };

            if (data.allowCategoryChange !== undefined) {
                payload.allowCategoryChange = data.allowCategoryChange;
            }

            const result = await telinfyProvider.createTemplate(payload);

            // Save to DB
            await db.insert(whatsappTemplates).values({
                projectId,
                name: data.name,
                language: data.language,
                category: data.category,
                status: 'PENDING',
                components: data.components,
                rawData: result,
            });

            return result;
        } catch (error) {
            logger.error('Failed to create template', { projectId, error });
            throw error;
        }
    }

    /**
     * Send bulk message using the project's Telinfy credentials.
     */
    async sendBulkMessage(projectId: string, payload: {
        templateName: string;
        language: string;
        recipients: Array<{
            to: string;
            body?: any;
            header?: any;
            button?: any;
        }>;
    }): Promise<any> {
        logger.info(`Sending bulk message for project ${projectId}`, {
            template: payload.templateName,
            count: payload.recipients.length
        });

        try {
            const telinfyProvider = await providerFactory.getTelinfyProvider(projectId);

            const response = await telinfyProvider.sendBulkMessage({
                templateName: payload.templateName,
                language: payload.language,
                recipients: payload.recipients
            });

            // Log messages to DB
            const messageInserts = payload.recipients.map(recipient => ({
                projectId,
                to: recipient.to,
                templateName: payload.templateName,
                language: payload.language,
                status: 'SENT',
                provider: 'telinfy',
                payload: { ...recipient, templateName: payload.templateName },
                header: recipient.header,
                body: recipient.body,
                button: recipient.button,
                sentAt: new Date(),
            }));

            await db.insert(whatsappMessages).values(messageInserts);

            return response;
        } catch (error) {
            logger.error('Failed to send bulk message', { projectId, error });
            throw error;
        }
    }

    /**
     * Get templates from local DB
     */
    async getTemplates(projectId: string, status?: string, limit: number = 50, offset: number = 0) {
        const whereClause = status
            ? and(eq(whatsappTemplates.projectId, projectId), eq(whatsappTemplates.status, status))
            : eq(whatsappTemplates.projectId, projectId);

        const data = await db.select()
            .from(whatsappTemplates)
            .where(whereClause)
            .orderBy(desc(whatsappTemplates.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(whatsappTemplates)
            .where(whereClause);

        return {
            data,
            count: Number(countResult?.count || 0)
        };
    }
}

export const whatsAppService = new WhatsAppService();

