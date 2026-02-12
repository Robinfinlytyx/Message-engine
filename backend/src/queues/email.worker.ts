import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { db } from '../db/db';
import { emailMessages } from '../db/schema/email_messages';
import { messageLogs } from '../db/schema/message_logs';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { nodemailerProvider } from '../providers/nodemailer.provider';
import { emailService } from '../services/email.service';
import { MessageStatus } from '../types';
import { logger } from '../utils/logger';

interface EmailJobData {
    messageId: string;
}

/**
 * Process individual email
 */
async function processSingleEmail(job: Job<EmailJobData>): Promise<void> {
    const startTime = Date.now();
    const { messageId } = job.data;

    logger.info('Processing email job', { messageId, jobId: job.id });

    try {
        // Fetch email from database
        const email = await db.query.emailMessages.findFirst({
            where: eq(emailMessages.id, messageId),
        });

        if (!email) {
            throw new Error(`Email message not found: ${messageId}`);
        }

        // Skip if already sent/delivered
        if (email.status === MessageStatus.SENT || email.status === MessageStatus.DELIVERED) {
            logger.warn('Email already processed, skipping', { messageId, status: email.status });
            return;
        }

        // Send via Nodemailer
        const result = await nodemailerProvider.sendEmail({
            to: email.to,
            cc: email.cc || undefined,
            bcc: email.bcc || undefined,
            from: email.from || undefined,
            replyTo: email.replyTo || undefined,
            subject: email.subject,
            html: email.htmlContent || undefined,
            text: email.textContent || undefined,
            attachments: email.attachments as any,
        });

        const duration = Date.now() - startTime;

        // Update status to SENT
        await emailService.updateEmailStatus(
            messageId,
            MessageStatus.SENT,
            undefined,
            result.messageId
        );

        // Log success
        await db.insert(messageLogs).values({
            id: uuidv4(),
            projectId: email.projectId,
            channel: 'email',
            messageId,
            eventType: 'sent',
            newStatus: MessageStatus.SENT,
            providerResponse: result as any,
            durationMs: duration,
            createdAt: new Date(),
        });

        logger.info('Email sent successfully', {
            messageId,
            providerMessageId: result.messageId,
            duration,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error('Failed to send email', {
            messageId,
            error: errorMessage,
            attempt: job.attemptsMade,
        });

        // Fetch current email to get retry info
        const email = await db.query.emailMessages.findFirst({
            where: eq(emailMessages.id, messageId),
        });

        if (!email) throw error;

        const newRetryCount = email.retryCount + 1;

        if (newRetryCount < email.maxRetries && job.attemptsMade < 3) {
            // Schedule retry with exponential backoff
            const retryDelay = Math.pow(2, newRetryCount) * 60000; // 1min, 2min, 4min...
            const nextRetryAt = new Date(Date.now() + retryDelay);

            await db
                .update(emailMessages)
                .set({
                    retryCount: newRetryCount,
                    nextRetryAt,
                    error: { message: errorMessage, attempt: newRetryCount },
                    updatedAt: new Date(),
                })
                .where(eq(emailMessages.id, messageId));

            logger.info('Email retry scheduled', {
                messageId,
                retryCount: newRetryCount,
                nextRetryAt,
            });

            throw error; // Let BullMQ handle the retry
        } else {
            // Max retries exceeded - mark as FAILED
            await emailService.updateEmailStatus(messageId, MessageStatus.FAILED, {
                message: errorMessage,
                maxRetriesExceeded: true,
            });

            logger.warn('Email max retries exceeded', { messageId, retryCount: newRetryCount });
        }

        throw error;
    }
}

/**
 * Email Worker
 */
export const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job) => {
        if (job.name === 'send-email') {
            return await processSingleEmail(job);
        } else {
            throw new Error(`Unknown job type: ${job.name}`);
        }
    },
    {
        connection: {
            host: config.redis.host,
            port: config.redis.port,
        },
        concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5'),
        limiter: {
            max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX || '100'),
            duration: parseInt(process.env.EMAIL_RATE_LIMIT_DURATION || '1000'),
        },
    }
);

emailWorker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id });
});

emailWorker.on('failed', (job, err) => {
    logger.error('Email job failed', {
        jobId: job?.id,
        error: err.message,
    });
});

emailWorker.on('error', (err) => {
    logger.error('Email worker error', { error: err.message });
});

logger.info('Email worker started', {
    concurrency: process.env.EMAIL_WORKER_CONCURRENCY || 5,
    rateLimit: `${process.env.EMAIL_RATE_LIMIT_MAX || 100} per ${process.env.EMAIL_RATE_LIMIT_DURATION || 1000}ms`,
});
