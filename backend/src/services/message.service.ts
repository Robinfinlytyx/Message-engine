import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db/db';
import { whatsappMessages, WhatsAppMessageInsert } from '../db/schema/whatsapp_messages';
import { messageLogs } from '../db/schema/message_logs';
import { eq, and, sql, count, inArray } from 'drizzle-orm';
import { whatsappQueue } from '../queues/whatsapp.queue';
import { logger } from '../utils/logger';
import { MessageStatus, SendTemplateRequest, SendTemplateResponse, Channel } from '../types';

class MessageService {
    /**
     * Send a WhatsApp template message
     * 1. Validates request
     * 2. Stores message in whatsapp_messages table
     * 3. Creates log entry
     * 4. Adds job to BullMQ queue
     * 5. Returns messageId
     */
    async sendTemplateMessage(request: SendTemplateRequest, projectId: string): Promise<SendTemplateResponse> {
        // Format phone number to ensure country code
        let formattedTo = String(request.to).replace(/[\s-]/g, '');
        if (formattedTo.length === 10 && /^\d+$/.test(formattedTo)) {
            formattedTo = `+91${formattedTo}`;
        } else if (formattedTo.length === 12 && formattedTo.startsWith('91')) {
            formattedTo = `+${formattedTo}`;
        }
        request.to = formattedTo;

        // Build the payload for Telinfy API
        const payload = {
            to: request.to,
            templateName: request.templateName,
            language: request.language,
            header: request.header || null,
            body: request.body || null,
            button: request.button || null,
        };

        logger.info('Creating new WhatsApp template message', {
            projectId,
            to: request.to,
            templateName: request.templateName,
        });

        // Store message in whatsapp_messages table
        const insertData: WhatsAppMessageInsert = {
            projectId,
            to: request.to,
            templateName: request.templateName,
            language: request.language,
            header: request.header as Record<string, unknown> | null,
            body: request.body as Record<string, unknown> | null,
            button: request.button as Record<string, unknown>[] | null,
            payload,
            provider: 'telinfy',
            status: MessageStatus.QUEUED,
        };

        const [insertedMessage] = await db.insert(whatsappMessages).values(insertData).returning();

        const messageId = insertedMessage.id;

        // Create log entry for queued status
        await this.createMessageLog({
            projectId,
            channel: 'whatsapp',
            messageId,
            eventType: 'queued',
            newStatus: MessageStatus.QUEUED,
            details: { templateName: request.templateName, to: request.to },
        });

        // Add job to queue
        await whatsappQueue.add('send-template', { messageId }, { jobId: messageId });

        logger.info('WhatsApp message queued successfully', { messageId, projectId });

        return {
            messageId,
            channel: 'whatsapp',
            status: MessageStatus.QUEUED,
        };
    }

    /**
     * Update WhatsApp message status from webhook
     */
    async updateWhatsAppMessageStatus(
        providerMessageId: string,
        status: MessageStatus,
        error?: Record<string, unknown>
    ): Promise<void> {
        logger.info('Updating WhatsApp message status', { providerMessageId, status });

        // Get current message for logging
        const message = await db.query.whatsappMessages.findFirst({
            where: eq(whatsappMessages.providerMessageId, providerMessageId),
        });

        if (!message) {
            logger.warn('Message not found for status update', { providerMessageId });
            return;
        }

        const previousStatus = message.status;
        const updateData: Record<string, unknown> = {
            status,
            error: error || null,
            updatedAt: new Date(),
        };

        // Set appropriate timestamp based on status
        if (status === MessageStatus.SENT) {
            updateData.sentAt = new Date();
        } else if (status === MessageStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        } else if (status === MessageStatus.READ) {
            updateData.readAt = new Date();
        }

        await db
            .update(whatsappMessages)
            .set(updateData)
            .where(eq(whatsappMessages.providerMessageId, providerMessageId));

        // Create log entry for status change
        await this.createMessageLog({
            projectId: message.projectId,
            channel: 'whatsapp',
            messageId: message.id,
            eventType: 'status_change',
            previousStatus,
            newStatus: status,
            error: error ? { message: JSON.stringify(error) } : undefined,
        });
    }

    /**
     * Get WhatsApp message by ID
     */
    async getWhatsAppMessageById(id: string) {
        return db.query.whatsappMessages.findFirst({
            where: eq(whatsappMessages.id, id),
        });
    }

    /**
     * Get WhatsApp message by provider message ID (wamId)
     */
    async getWhatsAppMessageByProviderMessageId(wamId: string) {
        return db.query.whatsappMessages.findFirst({
            where: eq(whatsappMessages.providerMessageId, wamId),
        });
    }

    /**
     * Get WhatsApp messages by project
     */
    async getWhatsAppMessagesByProject(projectId: string, limit: number = 50) {
        return db.query.whatsappMessages.findMany({
            where: eq(whatsappMessages.projectId, projectId),
            limit,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
        });
    }

    /**
     * Get all messages (admin) with filtering and pagination
     */
    async getAllMessages(params: {
        projectId?: string;
        projectIds?: string[];
        status?: MessageStatus;
        limit?: number;
        offset?: number;
    }) {
        const { projectId, projectIds, status, limit = 50, offset = 0 } = params;

        const conditions = [];
        if (projectId) conditions.push(eq(whatsappMessages.projectId, projectId));
        if (projectIds && projectIds.length > 0) conditions.push(inArray(whatsappMessages.projectId, projectIds));
        if (status) {
            // Case-insensitive comparison using LOWER()
            conditions.push(sql`LOWER(${whatsappMessages.status}) = ${status.toLowerCase()}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get paginated data
        const data = await db.query.whatsappMessages.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
        });

        // Get total count for pagination
        const countResult = await db
            .select({ total: count() })
            .from(whatsappMessages)
            .where(whereClause);

        const totalCount = countResult[0]?.total ?? 0;

        return { data, count: totalCount };
    }

    /**
     * Create a message log entry
     */
    async createMessageLog(data: {
        projectId: string;
        channel: Channel;
        messageId: string;
        eventType: string;
        previousStatus?: string;
        newStatus?: string;
        details?: Record<string, unknown>;
        providerResponse?: Record<string, unknown>;
        error?: { code?: string; message?: string; details?: unknown };
        retryAttempt?: number;
        durationMs?: number;
        source?: string;
    }): Promise<void> {
        await db.insert(messageLogs).values({
            id: uuidv4(),
            projectId: data.projectId,
            channel: data.channel,
            messageId: data.messageId,
            eventType: data.eventType,
            previousStatus: data.previousStatus,
            newStatus: data.newStatus,
            details: data.details,
            providerResponse: data.providerResponse,
            error: data.error,
            retryAttempt: data.retryAttempt,
            durationMs: data.durationMs,
            source: data.source,
            createdAt: new Date(),
        });
    }

    /**
     * Get message logs for a specific message
     */
    async getMessageLogs(messageId: string) {
        return db.query.messageLogs.findMany({
            where: eq(messageLogs.messageId, messageId),
            orderBy: (logs, { asc }) => [asc(logs.createdAt)],
        });
    }

    // =========================================================================
    // Legacy methods for backward compatibility (use generic messages table)
    // These can be removed once migration is complete
    // =========================================================================

    /**
     * @deprecated Use updateWhatsAppMessageStatus instead
     */
    async updateMessageStatus(
        wamId: string,
        status: MessageStatus,
        error?: Record<string, unknown>
    ): Promise<void> {
        // Try new table first, fallback to old
        const whatsappMsg = await this.getWhatsAppMessageByProviderMessageId(wamId);
        if (whatsappMsg) {
            await this.updateWhatsAppMessageStatus(wamId, status, error);
        } else {
            // Fallback to old messages table
            await db
                .update(schema.messages)
                .set({
                    status,
                    error: error || null,
                    updatedAt: new Date(),
                })
                .where(eq(schema.messages.providerMessageId, wamId));
        }
    }

    /**
     * @deprecated Use getWhatsAppMessageById instead
     */
    async getMessageById(id: string) {
        return db.query.messages.findFirst({
            where: eq(schema.messages.id, id),
        });
    }

    /**
     * @deprecated Use getWhatsAppMessageByProviderMessageId instead
     */
    async getMessageByProviderMessageId(wamId: string) {
        return db.query.messages.findFirst({
            where: eq(schema.messages.providerMessageId, wamId),
        });
    }
}

export const messageService = new MessageService();
