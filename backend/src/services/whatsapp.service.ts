import { db } from '../db/db';
import { whatsappTemplates } from '../db/schema/whatsapp_templates';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { telinfyProvider } from '../providers/telinfy.provider';
import { logger } from '../utils/logger';
import { eq, and } from 'drizzle-orm';
import { WhatsAppTemplate } from '../types';

export class WhatsAppService {
    /**
     * Sync templates from Telinfy to local DB for a specific project
     * Note: Since Telinfy credentials are global, we just fetch all and assign to project
     */
    async syncTemplates(projectId: string): Promise<WhatsAppTemplate[]> {
        logger.info(`Syncing templates for project ${projectId}`);
        try {
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
                    target: [whatsappTemplates.name], // Assuming name is unique, or name+language
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
     * Create a new template
     */
    /**
     * Create a new template
     */
    async createTemplate(projectId: string, data: any): Promise<any> {
        logger.info(`Creating template for project ${projectId}`, { name: data.name });
        try {
            // 1. Create on Telinfy
            // Telinfy requires 'label' and 'components' structure
            const payload: Record<string, any> = {
                name: data.name,
                category: data.category,
                language: data.language,
                label: data.label || data.name, // Default label to name
                components: data.components || []
            };

            if (data.allowCategoryChange !== undefined) {
                payload.allowCategoryChange = data.allowCategoryChange;
            }

            const result = await telinfyProvider.createTemplate(payload);

            // 2. Save to DB
            await db.insert(whatsappTemplates).values({
                projectId,
                name: data.name,
                language: data.language,
                category: data.category,
                status: 'PENDING', // Usually pending after creation
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
     * Send bulk message (Notify)
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
            // 1. Call Telinfy Notify endpoint
            const response = await telinfyProvider.sendBulkMessage({
                templateName: payload.templateName,
                language: payload.language,
                recipients: payload.recipients
            });

            // 2. Log messages to DB (in background or batch)
            const messageInserts = payload.recipients.map(recipient => ({
                projectId,
                to: recipient.to,
                templateName: payload.templateName,
                language: payload.language,
                status: 'SENT', // Assumed sent if API returns success
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
    /**
     * Get templates from local DB
     */
    async getTemplates(projectId: string, status?: string): Promise<any[]> {
        const whereClause = status
            ? and(eq(whatsappTemplates.projectId, projectId), eq(whatsappTemplates.status, status))
            : eq(whatsappTemplates.projectId, projectId);

        const templates = await db.select().from(whatsappTemplates).where(whereClause);
        return templates;
    }
}

export const whatsAppService = new WhatsAppService();
