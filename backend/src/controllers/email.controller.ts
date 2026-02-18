import { Request, Response, NextFunction } from 'express';
import { emailService, BulkEmailRequest } from '../services/email.service';
import { SendEmailRequest } from '../types';
import { logger } from '../utils/logger';

/**
 * Send single email
 * POST /api/email/send
 */
export async function sendEmailController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const request = req.body as SendEmailRequest;
        const projectId = (req as any).project?.id;

        if (!projectId) {
            res.status(401).json({ error: 'Unauthorized - Valid API key required' });
            return;
        }

        // Validate required fields
        if (!request.to) {
            res.status(400).json({ error: 'Missing required field: to' });
            return;
        }

        if (!request.subject && !request.templateName && !(request as any).templateId) {
            res.status(400).json({ error: 'Subject is required unless using a template' });
            return;
        }

        if (!request.html && !request.text && !request.templateName) {
            res.status(400).json({ error: 'Email must have html, text, or templateName' });
            return;
        }

        const result = await emailService.sendEmail(request, projectId);

        res.status(201).json({
            ...result,
            message: 'Email queued successfully',
        });
    } catch (error) {
        logger.error('Send email error', { error });
        next(error);
    }
}

/**
 * Send bulk emails
 * POST /api/email/send-bulk
 */
export async function sendBulkEmailsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const request = req.body as BulkEmailRequest;
        const projectId = (req as any).project?.id;

        if (!projectId) {
            res.status(401).json({ error: 'Unauthorized - Valid API key required' });
            return;
        }

        if (!request.emails || !Array.isArray(request.emails) || request.emails.length === 0) {
            res.status(400).json({ error: 'emails array is required and must not be empty' });
            return;
        }

        // Validate each email
        for (const email of request.emails) {
            if (!email.to) {
                res.status(400).json({ error: 'Each email must have a to field' });
                return;
            }
            if (!email.subject && !email.templateName && !(email as any).templateId) {
                res.status(400).json({ error: 'Each email must have a subject unless using a template' });
                return;
            }
        }

        const result = await emailService.sendBulkEmails(request, projectId);

        res.status(201).json({
            ...result,
            message: `Bulk emails queued in ${result.batchCount} batches`,
        });
    } catch (error) {
        logger.error('Send bulk emails error', { error });
        next(error);
    }
}

/**
 * Get batch status
 * GET /api/email/batch/:batchId
 */
export async function getBatchStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const batchId = req.params.batchId as string;

        const status = await emailService.getBatchStatus(batchId);

        if (!status) {
            res.status(404).json({ error: 'Batch not found' });
            return;
        }

        res.json(status);
    } catch (error) {
        logger.error('Get batch status error', { error });
        next(error);
    }
}

/**
 * Get failed emails from batch
 * GET /api/email/batch/:batchId/failed
 */
export async function getFailedEmailsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const batchId = req.params.batchId as string;

        const failedEmails = await emailService.getFailedEmails(batchId);

        res.json({
            batchId,
            failedEmails,
            count: failedEmails.length,
        });
    } catch (error) {
        logger.error('Get failed emails error', { error });
        next(error);
    }
}

/**
 * Retry failed emails from batch
 * POST /api/email/batch/:batchId/retry
 */
export async function retryFailedEmailsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const batchId = req.params.batchId as string;

        const result = await emailService.retryFailedEmails(batchId);

        res.json({
            message: `Retried ${result.retriedCount} failed emails`,
            ...result,
        });
    } catch (error) {
        logger.error('Retry failed emails error', { error });
        next(error);
    }
}

/**
 * Get emails by project
 * GET /api/email/project/:projectId
 */
export async function getProjectEmailsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        const status = req.query.status ? String(req.query.status) : undefined;

        // Cast status to MessageStatus if needed, or pass string (service accepts any for now due to SQL)
        const result = await emailService.getEmailsByProject(projectId, limit, offset, status as any);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * Get batches by project
 * GET /api/email/project/:projectId/batches
 */
export async function getProjectBatchesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const offset = req.query.offset ? Number(req.query.offset) : 0;

        const result = await emailService.getBatchesByProject(projectId, limit, offset);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

// --- Template Controllers ---

/**
 * Create email template
 * POST /api/email/templates
 */
export async function createTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = (req as any).project?.id;
        if (!projectId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const data = req.body;
        if (!data.name || !data.subject) {
            res.status(400).json({ error: 'Name and subject are required' });
            return;
        }

        const template = await emailService.createTemplate(projectId, data);
        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
}

/**
 * Get templates
 * GET /api/email/templates
 */
export async function getTemplatesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = (req as any).project?.id;
        if (!projectId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const templates = await emailService.getTemplates(projectId);
        res.json(templates);
    } catch (error) {
        next(error);
    }
}

/**
 * Get template by ID
 * GET /api/email/templates/:templateId
 */
export async function getTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const templateId = req.params.templateId as string;
        const template = await emailService.getTemplate(templateId);

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json(template);
    } catch (error) {
        next(error);
    }
}

/**
 * Update template
 * PUT /api/email/templates/:templateId
 */
export async function updateTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const templateId = req.params.templateId as string;
        const data = req.body;

        const template = await emailService.updateTemplate(templateId, data);

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json(template);
    } catch (error) {
        next(error);
    }
}

/**
 * Delete template
 * DELETE /api/email/templates/:templateId
 */
export async function deleteTemplateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const templateId = req.params.templateId as string;
        await emailService.deleteTemplate(templateId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
