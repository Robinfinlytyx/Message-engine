import { Request, Response, NextFunction } from 'express';
import { campaignService, CreateCampaignRequest } from '../services/campaign.service';
import { logger } from '../utils/logger';

/**
 * Create a new campaign
 * POST /api/whatsapp/campaign
 */
export async function createCampaignController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const body = req.body as CreateCampaignRequest;

        // Validate required fields
        if (!body.name) {
            res.status(400).json({ error: 'Campaign name is required' });
            return;
        }

        if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            res.status(400).json({ error: 'Campaign must have at least one message' });
            return;
        }

        // Validate each message has required fields
        for (let i = 0; i < body.messages.length; i++) {
            const msg = body.messages[i];
            if (!msg.to || !msg.templateName || !msg.language) {
                res.status(400).json({
                    error: `Message at index ${i} is missing required fields (to, templateName, language)`,
                });
                return;
            }
        }

        logger.info('Creating campaign', {
            projectId,
            name: body.name,
            messageCount: body.messages.length,
        });

        const result = await campaignService.createCampaign(projectId, body);

        res.status(201).json({
            data: result,
            message: 'Campaign created successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List campaigns for the authenticated project
 * GET /api/whatsapp/campaigns
 */
export async function listCampaignsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const campaigns = await campaignService.getCampaignsByProject(projectId, limit);

        res.json({
            data: campaigns.map(c => ({
                id: c.id,
                name: c.name,
                status: c.status,
                messageCount: c.messageCount,
                scheduleTime: c.scheduleTime,
                telinfyCampaignId: c.telinfyCampaignId,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            })),
            count: campaigns.length,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a specific campaign by ID
 * GET /api/whatsapp/campaign/:id
 */
export async function getCampaignController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.project!.id;
        const id = req.params.id as string;

        const campaign = await campaignService.getCampaignByIdForProject(id, projectId);

        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }

        res.json({
            data: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                messageCount: campaign.messageCount,
                scheduleTime: campaign.scheduleTime,
                telinfyCampaignId: campaign.telinfyCampaignId,
                fileId: campaign.fileId,
                error: campaign.error,
                createdAt: campaign.createdAt,
                updatedAt: campaign.updatedAt,
                completedAt: campaign.completedAt,
            },
        });
    } catch (error) {
        next(error);
    }
}
