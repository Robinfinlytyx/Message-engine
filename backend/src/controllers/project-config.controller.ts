import { Request, Response, NextFunction } from 'express';
import { projectConfigService } from '../services/project-config.service';
import { providerFactory } from '../providers/provider.factory';
import { logger } from '../utils/logger';

/**
 * Get project configuration (secrets masked)
 * GET /api/admin/projects/:projectId/config
 */
export async function getProjectConfigController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const config = await projectConfigService.getConfigMasked(projectId);

        if (!config) {
            res.json({
                data: null,
                message: 'No configuration found. This project uses global defaults.',
            });
            return;
        }

        res.json({ data: config });
    } catch (error) {
        next(error);
    }
}

/**
 * Create or update project configuration
 * PUT /api/admin/projects/:projectId/config
 */
export async function upsertProjectConfigController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const { whatsapp, email } = req.body;

        const input: Record<string, unknown> = {};

        // Map WhatsApp config
        if (whatsapp) {
            input.whatsappEnabled = whatsapp.enabled ?? false;
            if (whatsapp.telinfyApiKey) input.telinfyApiKey = whatsapp.telinfyApiKey;

            // Handle both legacy and new frontend property names
            if (whatsapp.whatsappBusinessId) input.telinfyWhatsappBusinessId = whatsapp.whatsappBusinessId;
            if (whatsapp.telinfyWhatsappBusinessId) input.telinfyWhatsappBusinessId = whatsapp.telinfyWhatsappBusinessId;

            // New Template Fields
            if (whatsapp.telinfyAccessId) input.telinfyAccessId = whatsapp.telinfyAccessId;
            if (whatsapp.telinfyPhoneNumberId) input.telinfyPhoneNumberId = whatsapp.telinfyPhoneNumberId;
            if (whatsapp.telinfyUserName) input.telinfyUserName = whatsapp.telinfyUserName;
            if (whatsapp.telinfyBusinessAccountId) input.telinfyBusinessAccountId = whatsapp.telinfyBusinessAccountId;
        }

        // Map Email config
        if (email) {
            input.emailEnabled = email.enabled ?? false;
            if (email.smtpHost) input.smtpHost = email.smtpHost;
            if (email.smtpPort) input.smtpPort = email.smtpPort;
            if (email.smtpSecure !== undefined) input.smtpSecure = email.smtpSecure;
            if (email.smtpUser) input.smtpUser = email.smtpUser;
            if (email.smtpPassword) input.smtpPassword = email.smtpPassword;
            if (email.defaultFromEmail) input.defaultFromEmail = email.defaultFromEmail;
            if (email.defaultFromName) input.defaultFromName = email.defaultFromName;
            if (email.batchSize) input.emailBatchSize = email.batchSize;
            if (email.maxRetries) input.emailMaxRetries = email.maxRetries;
            if (email.rateLimitMax) input.emailRateLimitMax = email.rateLimitMax;
            if (email.rateLimitDuration) input.emailRateLimitDuration = email.rateLimitDuration;
        }

        const config = await projectConfigService.upsertConfig(projectId, input);

        // Invalidate cached providers so they pick up new credentials
        providerFactory.invalidate(projectId);

        logger.info('Project configuration saved', { projectId });

        res.json({
            data: {
                ...config,
                // Mask secrets in response
                telinfyApiKey: config.telinfyApiKey ? '****' + config.telinfyApiKey.slice(-4) : null,
                telinfyAccessId: config.telinfyAccessId ? '****' : null,
                smtpPassword: config.smtpPassword ? '****' : null,
            },
            message: 'Configuration saved successfully',
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('unique constraint')) {
            res.status(409).json({ error: 'Configuration already exists for this project' });
            return;
        }
        next(error);
    }
}

/**
 * Delete project configuration (revert to defaults)
 * DELETE /api/admin/projects/:projectId/config
 */
export async function deleteProjectConfigController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;
        const deleted = await projectConfigService.deleteConfig(projectId);

        if (!deleted) {
            res.status(404).json({ error: 'No configuration found for this project' });
            return;
        }

        // Invalidate cached providers
        providerFactory.invalidate(projectId);

        res.json({ message: 'Configuration deleted. Project will use global defaults.' });
    } catch (error) {
        next(error);
    }
}

/**
 * Test WhatsApp (Telinfy) credentials
 * POST /api/admin/projects/:projectId/config/test-whatsapp
 */
export async function testWhatsAppConfigController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;

        // Try to create a provider — this validates the credentials exist
        const provider = await providerFactory.getTelinfyProvider(projectId);

        // Try to fetch templates (lightweight API call to verify credentials)
        const templates = await provider.getTemplates();

        res.json({
            success: true,
            message: 'WhatsApp credentials are valid',
            templateCount: templates.length,
            whatsAppBusinessId: provider.getWhatsAppBusinessId(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({
            success: false,
            message: 'WhatsApp credential test failed',
            error: message,
        });
    }
}

/**
 * Test Email (SMTP) credentials
 * POST /api/admin/projects/:projectId/config/test-email
 */
export async function testEmailConfigController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.params.projectId as string;

        const provider = await providerFactory.getNodemailerProvider(projectId);
        const isConnected = await provider.verifyConnection();

        if (isConnected) {
            res.json({
                success: true,
                message: 'SMTP connection verified successfully',
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'SMTP connection verification failed',
            });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({
            success: false,
            message: 'Email credential test failed',
            error: message,
        });
    }
}
