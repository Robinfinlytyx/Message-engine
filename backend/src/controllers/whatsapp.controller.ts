import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';
import { webhookService } from '../services/webhook.service';
import { whatsAppService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';
import {
    SendTemplateRequest,
    TelinfyWebhookPayload,
    MessageStatus,
} from '../types';

/**
 * Send Template Message Controller
 * POST /api/whatsapp/send-template
 */
export async function sendTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body as SendTemplateRequest;

        // Validate required fields
        if (!body.to) {
            res.status(400).json({ error: 'Missing required field: to' });
            return;
        }
        if (!body.templateName) {
            res.status(400).json({ error: 'Missing required field: templateName' });
            return;
        }
        if (!body.language) {
            res.status(400).json({ error: 'Missing required field: language' });
            return;
        }

        // req.project is set by apiKeyAuth middleware
        const projectId = req.project!.id;

        // Send message via service with project context
        const result = await messageService.sendTemplateMessage(body, projectId);

        // Return 202 Accepted
        res.status(202).json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * Webhook Controller
 * POST /webhooks/whatsapp
 * Handles: messages, statuses, errors
 */
export async function webhookController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const payload = req.body as TelinfyWebhookPayload;

        logger.info('Received webhook', {
            whatsappBusinessId: payload.whatsappBusinessId,
            hasMessages: !!payload.messages?.length,
            hasStatuses: !!payload.statuses?.length,
            hasErrors: !!payload.errors?.length,
        });

        // Determine event type
        let eventType = 'unknown';
        if (payload.messages && payload.messages.length > 0) {
            eventType = 'messages';
        } else if (payload.statuses && payload.statuses.length > 0) {
            eventType = 'statuses';
        } else if (payload.errors && payload.errors.length > 0) {
            eventType = 'errors';
        }

        // Store raw webhook event
        await webhookService.storeWebhookEvent(
            'whatsapp',  // Channel
            'telinfy',   // Provider
            eventType,
            payload as unknown as Record<string, unknown>
        );

        // Process status updates
        if (payload.statuses) {
            for (const status of payload.statuses) {
                const mappedStatus = mapTelinfyStatus(status.status);

                if (mappedStatus) {
                    const errorData = status.errors
                        ? { errors: status.errors }
                        : undefined;

                    await messageService.updateMessageStatus(
                        status.id,
                        mappedStatus,
                        errorData
                    );
                }
            }
        }

        // Process inbound messages (store for reference)
        if (payload.messages) {
            for (const message of payload.messages) {
                logger.info('Received inbound message', {
                    from: message.from,
                    type: message.type,
                    messageId: message.id,
                });
                // Inbound messages are stored via webhookService above
                // Additional processing can be added here if needed
            }
        }

        // Process errors
        if (payload.errors) {
            for (const error of payload.errors) {
                logger.error('Webhook error received', {
                    code: error.code,
                    title: error.title,
                    details: error.details,
                });
            }
        }

        // Always return 200 OK
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        // Log error but still return 200 to prevent webhook retries
        logger.error('Error processing webhook', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(200).json({ status: 'ok' });
    }
}

/**
 * Map Telinfy status to our MessageStatus enum
 */
function mapTelinfyStatus(
    telinfyStatus: string
): MessageStatus | null {
    const statusMap: Record<string, MessageStatus> = {
        sent: MessageStatus.SENT,
        delivered: MessageStatus.DELIVERED,
        read: MessageStatus.READ,
        failed: MessageStatus.FAILED,
    };

    return statusMap[telinfyStatus.toLowerCase()] || null;
}

/**
 * Get Templates Controller
 * GET /api/whatsapp/templates
 */
export async function getTemplatesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // req.project is set by apiKeyAuth
        const projectId = req.project!.id;
        const status = req.query.status as string | undefined;
        const templates = await whatsAppService.getTemplates(projectId, status);
        res.json({ data: templates });
    } catch (error) {
        next(error);
    }
}

/**
 * Sync Templates Controller
 * POST /api/whatsapp/templates/sync
 */
export async function syncTemplatesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const templates = await whatsAppService.syncTemplates(projectId);
        res.json({ data: templates });
    } catch (error) {
        next(error);
    }
}

/**
 * Create Template Controller
 * POST /api/whatsapp/templates
 */
export async function createTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const body = req.body;
        const result = await whatsAppService.createTemplate(projectId, body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * Send Bulk Message Controller
 * POST /api/whatsapp/notify
 */
export async function sendBulkMessageController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const body = req.body;

        // Basic validation
        if (!body.templateName || !body.language || !body.recipients) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const result = await whatsAppService.sendBulkMessage(projectId, {
            templateName: body.templateName,
            language: body.language,
            recipients: body.recipients
        });

        res.status(202).json(result);
    } catch (error) {
        next(error);
    }
}
