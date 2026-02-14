import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import { emailMessages, EmailMessageInsert } from '../db/schema/email_messages';
import { emailBatches, EmailBatchInsert } from '../db/schema/email_batches';
import { emailTemplates, EmailTemplateInsert } from '../db/schema/email_templates';
import { messageLogs } from '../db/schema/message_logs';
import { eq, and, sql, count } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { MessageStatus, SendEmailRequest } from '../types';
import { emailQueue } from '../queues/email.queue';

interface BatchResponse {
    batchId: string;
    totalEmails: number;
    batchCount: number;
    status: MessageStatus;
}

interface BatchStatus {
    batchId: string;
    status: string;
    totalEmails: number;
    processedCount: number;
    successCount: number;
    failedCount: number;
    progress: number;
    createdAt: Date;
    completedAt?: Date;
}

interface FailedEmail {
    messageId: string;
    to: string;
    subject: string;
    error: Record<string, unknown> | null;
    retryCount: number;
    lastAttemptAt: Date;
}

interface BulkEmailRequest {
    batchName?: string;
    batchSize?: number;
    emails: SendEmailRequest[];
    metadata?: Record<string, unknown>;
}

const DEFAULT_BATCH_SIZE = 100;
const BATCH_DELAY_MS = 5000; // 5 seconds between batches

class EmailService {
    /**
     * Helper to extract variables from text
     */
    private extractVariables(text: string): string[] {
        const regex = /{{([\w]+)}}/g;
        const matches = text.matchAll(regex);
        const variables = new Set<string>();
        for (const match of matches) {
            variables.add(match[1]);
        }
        return Array.from(variables);
    }

    /**
     * Create email template
     */
    async createTemplate(projectId: string, data: { name: string; subject: string; htmlContent?: string; textContent?: string; variables?: string[] }): Promise<any> {
        // Auto-extract variables if not provided
        let variables = data.variables;
        if (!variables || variables.length === 0) {
            const subjectVars = this.extractVariables(data.subject);
            const htmlVars = data.htmlContent ? this.extractVariables(data.htmlContent) : [];
            const textVars = data.textContent ? this.extractVariables(data.textContent) : [];
            variables = Array.from(new Set([...subjectVars, ...htmlVars, ...textVars]));
        }

        const [template] = await db.insert(emailTemplates).values({
            projectId,
            ...data,
            variables,
        }).returning();
        return template;
    }

    /**
     * Get templates by project
     */
    async getTemplates(projectId: string): Promise<any[]> {
        return db.query.emailTemplates.findMany({
            where: eq(emailTemplates.projectId, projectId),
            orderBy: (templates, { desc }) => [desc(templates.createdAt)],
        });
    }

    /**
     * Get template by ID
     */
    async getTemplate(templateId: string): Promise<any> {
        return db.query.emailTemplates.findFirst({
            where: eq(emailTemplates.id, templateId),
        });
    }

    /**
     * Update email template
     */
    async updateTemplate(templateId: string, data: Partial<EmailTemplateInsert>): Promise<any> {
        // If content is being updated but variables are not provided, re-extract them
        // Note: This is partial update, so we should ideally fetch existing content to merge?
        // Or just update variables if content changes and variables are not passed.
        // For simplicity and correctness, if content changes, client SHOULD pass variables or we should re-calculate.
        // To strictly re-calculate we need the full new state. 
        // Let's rely on what's passed for now, but if variables are missing and content is present, extract from *new* content.
        // A full re-calc would require fetching the existing template first. 

        let variables = data.variables;

        if ((!variables || variables.length === 0) && (data.subject || data.htmlContent || data.textContent)) {
            // We need to fetch existing to merge if we want to be perfect, 
            // but simpler strategy: if you update content without vars, we extract from NEW content only.
            // This might miss vars from unchanged fields if we don't fetch.
            // Let's fetch the current template to do it right.
            const current = await this.getTemplate(templateId);
            if (current) {
                const newSubject = data.subject !== undefined ? data.subject : current.subject;
                const newHtml = data.htmlContent !== undefined ? data.htmlContent : current.htmlContent;
                const newText = data.textContent !== undefined ? data.textContent : current.textContent;

                const subjectVars = this.extractVariables(newSubject || '');
                const htmlVars = this.extractVariables(newHtml || '');
                const textVars = this.extractVariables(newText || '');
                variables = Array.from(new Set([...subjectVars, ...htmlVars, ...textVars]));
            }
        }

        const updateData = { ...data, updatedAt: new Date() };
        if (variables) {
            updateData.variables = variables;
        }

        const [template] = await db
            .update(emailTemplates)
            .set(updateData)
            .where(eq(emailTemplates.id, templateId))
            .returning();
        return template;
    }

    /**
     * Delete email template
     */
    async deleteTemplate(templateId: string): Promise<void> {
        await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
    }

    /**
     * Send single email
     */
    async sendEmail(request: SendEmailRequest, projectId: string): Promise<{ messageId: string; channel: 'email'; status: MessageStatus }> {
        logger.info('Creating new email message', {
            projectId,
            to: request.to,
            subject: request.subject,
        });

        let subject = request.subject;
        let htmlContent = request.html;
        let textContent = request.text;
        let templateId = null;

        // Handle template substitution if templateId is provided
        if ((request as any).templateId) {
            templateId = (request as any).templateId;
            const template = await this.getTemplate(templateId);

            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }

            const variables = (request as any).templateVariables || {};

            // Simple substitution logic
            const substitute = (text: string, vars: Record<string, any>) => {
                let result = text;
                for (const [key, value] of Object.entries(vars)) {
                    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                }
                return result;
            };

            subject = substitute(template.subject, variables);
            if (template.htmlContent) htmlContent = substitute(template.htmlContent, variables);
            if (template.textContent) textContent = substitute(template.textContent, variables);
        }

        // Insert into email_messages table
        const insertData: EmailMessageInsert = {
            projectId,
            to: request.to,
            cc: request.cc || null,
            bcc: request.bcc || null,
            from: request.from,
            replyTo: request.replyTo,
            subject: subject || '', // Ensure subject is not null if coming from template
            templateName: request.templateName,
            templateId,
            htmlContent,
            textContent,
            templateVariables: (request as any).templateVariables || null,
            attachments: request.attachments as any,
            provider: 'nodemailer',
            status: MessageStatus.QUEUED,
        };

        const [insertedMessage] = await db.insert(emailMessages).values(insertData).returning();
        const messageId = insertedMessage.id;

        // Create log entry
        await this.createMessageLog({
            projectId,
            channel: 'email',
            messageId,
            eventType: 'queued',
            newStatus: MessageStatus.QUEUED,
            details: { to: request.to, subject: subject },
        });

        // Add to queue
        await emailQueue.add('send-email', { messageId }, { jobId: messageId });

        logger.info('Email message queued successfully', { messageId, projectId });

        return {
            messageId,
            channel: 'email',
            status: MessageStatus.QUEUED,
        };
    }

    /**
     * Send bulk emails with batching
     */
    async sendBulkEmails(request: BulkEmailRequest, projectId: string): Promise<BatchResponse> {
        const batchSize = request.batchSize || DEFAULT_BATCH_SIZE;
        const totalEmails = request.emails.length;
        const batchCount = Math.ceil(totalEmails / batchSize);

        logger.info('Creating bulk email batch', {
            projectId,
            totalEmails,
            batchSize,
            batchCount,
        });

        // Create batch record
        const batchData: EmailBatchInsert = {
            projectId,
            name: request.batchName || `Batch ${new Date().toISOString()}`,
            totalEmails,
            batchSize,
            status: MessageStatus.QUEUED,
            metadata: request.metadata || null,
        };

        const [batch] = await db.insert(emailBatches).values(batchData).returning();
        const batchId = batch.id;

        // Insert all emails
        // Helper function for substitution
        const substitute = (text: string, vars: Record<string, any>) => {
            let result = text;
            for (const [key, value] of Object.entries(vars)) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
            return result;
        };

        // Cache for templates to avoid repeated DB calls
        const templateCache = new Map<string, any>();

        const emailInserts: EmailMessageInsert[] = [];

        for (const email of request.emails) {
            let subject = email.subject;
            let htmlContent = email.html;
            let textContent = email.text;
            let templateId = (email as any).templateId;

            if (templateId) {
                if (!templateCache.has(templateId)) {
                    const template = await this.getTemplate(templateId);
                    if (template) {
                        templateCache.set(templateId, template);
                    } else {
                        logger.warn(`Template not found for bulk email: ${templateId}`);
                        // Skip this email or fail? 
                        // For bulk, let's treat it as a failure for this specific item but continue with others if possible?
                        // But we are constructing specific inserts here. 
                        // Let's set a flag to mark it as failed immediately in the batch.
                        // Or better, since we return a batch ID, maybe we should just fail this single entry insertion later?
                        // Actually, let's throw for now to force client to provide valid templates, 
                        // OR fallback to provided subject/html if available.

                        if (!email.subject) {
                            // If template missing and no fallback subject, we can't send.
                            // We will log this and skip adding to emailInserts to avoid DB error, 
                            // effectively dropping it.
                            logger.error(`Skipping email to ${email.to} because template ${templateId} is missing and no fallback subject provided.`);
                            continue;
                        }
                    }
                }

                const template = templateCache.get(templateId);
                if (template) {
                    const variables = (email as any).templateVariables || {};
                    subject = substitute(template.subject, variables);
                    if (template.htmlContent) htmlContent = substitute(template.htmlContent, variables);
                    if (template.textContent) textContent = substitute(template.textContent, variables);
                }
            } else {
                // No template, ensure subject matches
                if (!subject) {
                    logger.error(`Skipping email to ${email.to} because subject is missing.`);
                    continue;
                }
            }

            emailInserts.push({
                projectId,
                batchId,
                to: email.to,
                cc: email.cc || null,
                bcc: email.bcc || null,
                from: email.from,
                replyTo: email.replyTo,
                subject: subject || '',
                templateName: email.templateName,
                templateId, // Add this field
                htmlContent,
                textContent,
                templateVariables: (email as any).templateVariables || null,
                provider: 'nodemailer',
                status: MessageStatus.QUEUED,
            });
        }

        const insertedEmails = await db.insert(emailMessages).values(emailInserts).returning();

        // Create log entries
        await Promise.all(
            insertedEmails.map(email =>
                this.createMessageLog({
                    projectId,
                    channel: 'email',
                    messageId: email.id,
                    batchId,
                    eventType: 'queued',
                    newStatus: MessageStatus.QUEUED,
                    details: { to: email.to, subject: email.subject },
                })
            )
        );

        // Add emails to queue in batches with delays
        for (let i = 0; i < batchCount; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalEmails);
            const batchEmails = insertedEmails.slice(start, end);
            const delay = i * BATCH_DELAY_MS; // Stagger batches

            await emailQueue.addBulk(
                batchEmails.map(email => ({
                    name: 'send-email',
                    data: { messageId: email.id },
                    opts: { delay, jobId: email.id },
                }))
            );
        }

        // Update batch status to processing
        await db
            .update(emailBatches)
            .set({ status: 'PROCESSING', updatedAt: new Date() })
            .where(eq(emailBatches.id, batchId));

        logger.info('Bulk emails queued successfully', { batchId, totalEmails, batchCount });

        return {
            batchId,
            totalEmails,
            batchCount,
            status: MessageStatus.QUEUED,
        };
    }

    /**
     * Get batch status
     */
    async getBatchStatus(batchId: string): Promise<BatchStatus | null> {
        const batch = await db.query.emailBatches.findFirst({
            where: eq(emailBatches.id, batchId),
        });

        if (!batch) return null;

        const progress = batch.totalEmails > 0
            ? Math.round((batch.processedCount / batch.totalEmails) * 100)
            : 0;

        return {
            batchId: batch.id,
            status: batch.status,
            totalEmails: batch.totalEmails,
            processedCount: batch.processedCount,
            successCount: batch.successCount,
            failedCount: batch.failedCount,
            progress,
            createdAt: batch.createdAt,
            completedAt: batch.completedAt || undefined,
        };
    }

    /**
     * Get failed emails from a batch
     */
    async getFailedEmails(batchId: string): Promise<FailedEmail[]> {
        const failed = await db.query.emailMessages.findMany({
            where: and(
                eq(emailMessages.batchId, batchId),
                eq(emailMessages.status, MessageStatus.FAILED)
            ),
            orderBy: (emails, { desc }) => [desc(emails.updatedAt)],
        });

        return failed.map(email => ({
            messageId: email.id,
            to: email.to,
            subject: email.subject,
            error: email.error,
            retryCount: email.retryCount,
            lastAttemptAt: email.updatedAt,
        }));
    }

    /**
     * Retry failed emails from a batch
     */
    async retryFailedEmails(batchId: string): Promise<{ retriedCount: number }> {
        const failed = await db.query.emailMessages.findMany({
            where: and(
                eq(emailMessages.batchId, batchId),
                eq(emailMessages.status, MessageStatus.FAILED),
                sql`${emailMessages.retryCount} < ${emailMessages.maxRetries}`
            ),
        });

        logger.info('Retrying failed emails', { batchId, count: failed.length });

        // Reset status and queue for retry
        for (const email of failed) {
            await db
                .update(emailMessages)
                .set({
                    status: MessageStatus.QUEUED,
                    nextRetryAt: null,
                    updatedAt: new Date(),
                })
                .where(eq(emailMessages.id, email.id));

            await emailQueue.add('send-email', { messageId: email.id }, { jobId: email.id });

            await this.createMessageLog({
                projectId: email.projectId,
                channel: 'email',
                messageId: email.id,
                batchId,
                eventType: 'retry_scheduled',
                newStatus: MessageStatus.QUEUED,
                retryAttempt: email.retryCount + 1,
            });
        }

        return { retriedCount: failed.length };
    }

    /**
     * Update email message status
     */
    async updateEmailStatus(
        messageId: string,
        status: MessageStatus,
        error?: Record<string, unknown>,
        providerMessageId?: string
    ): Promise<void> {
        const message = await db.query.emailMessages.findFirst({
            where: eq(emailMessages.id, messageId),
        });

        if (!message) {
            logger.warn('Email message not found for status update', { messageId });
            return;
        }

        const previousStatus = message.status;
        const updateData: Record<string, any> = {
            status,
            error: error || null,
            updatedAt: new Date(),
        };

        if (providerMessageId) {
            updateData.providerMessageId = providerMessageId;
        }

        // Set timestamps based on status
        if (status === MessageStatus.SENT) {
            updateData.sentAt = new Date();
        } else if (status === MessageStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        }

        await db.update(emailMessages).set(updateData).where(eq(emailMessages.id, messageId));

        // Update batch counters if part of batch
        if (message.batchId) {
            await this.updateBatchCounters(message.batchId, status);
        }

        // Create log entry
        await this.createMessageLog({
            projectId: message.projectId,
            channel: 'email',
            messageId,
            batchId: message.batchId || undefined,
            eventType: 'status_change',
            previousStatus,
            newStatus: status,
            error: error ? { message: JSON.stringify(error) } : undefined,
        });
    }

    /**
     * Update batch counters
     */
    private async updateBatchCounters(batchId: string, status: MessageStatus): Promise<void> {
        const batch = await db.query.emailBatches.findFirst({
            where: eq(emailBatches.id, batchId),
        });

        if (!batch) return;

        const updateData: Record<string, any> = {
            processedCount: batch.processedCount + 1,
            updatedAt: new Date(),
        };

        if (status === MessageStatus.SENT || status === MessageStatus.DELIVERED) {
            updateData.successCount = batch.successCount + 1;
        } else if (status === MessageStatus.FAILED) {
            updateData.failedCount = batch.failedCount + 1;
        }

        // Check if batch is complete
        if (updateData.processedCount >= batch.totalEmails) {
            updateData.status = 'COMPLETED';
            updateData.completedAt = new Date();
        }

        await db.update(emailBatches).set(updateData).where(eq(emailBatches.id, batchId));
    }

    /**
     * Get emails by project
     */
    async getEmailsByProject(
        projectId: string,
        limit: number = 50,
        offset: number = 0,
        status?: MessageStatus
    ) {
        const conditions = [eq(emailMessages.projectId, projectId)];

        if (status) {
            conditions.push(sql`LOWER(${emailMessages.status}) = ${status.toLowerCase()}`);
        }

        const whereClause = and(...conditions);

        const data = await db.query.emailMessages.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: (emails, { desc }) => [desc(emails.createdAt)],
        });

        const countResult = await db
            .select({ total: count() })
            .from(emailMessages)
            .where(whereClause);

        return {
            data,
            count: countResult[0]?.total ?? 0,
        };
    }

    /**
     * Get batches by project
     */
    async getBatchesByProject(
        projectId: string,
        limit: number = 50,
        offset: number = 0
    ) {
        const whereClause = eq(emailBatches.projectId, projectId);

        const data = await db.query.emailBatches.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: (batches, { desc }) => [desc(batches.createdAt)],
        });

        const countResult = await db
            .select({ total: count() })
            .from(emailBatches)
            .where(whereClause);

        return {
            data,
            count: countResult[0]?.total ?? 0,
        };
    }

    /**
     * Create message log entry
     */
    private async createMessageLog(data: {
        projectId: string;
        channel: 'email';
        messageId: string;
        batchId?: string;
        eventType: string;
        previousStatus?: string;
        newStatus?: string;
        details?: Record<string, unknown>;
        providerResponse?: Record<string, unknown>;
        error?: { code?: string; message?: string; details?: unknown };
        retryAttempt?: number;
        durationMs?: number;
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
            createdAt: new Date(),
        });
    }
}

export const emailService = new EmailService();
export { BulkEmailRequest, BatchResponse, BatchStatus, FailedEmail };
