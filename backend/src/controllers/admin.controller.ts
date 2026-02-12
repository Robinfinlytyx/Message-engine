import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';
import { projectService } from '../services/project.service';
import { campaignService } from '../services/campaign.service';
import { db } from '../db/db';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { campaigns } from '../db/schema/campaigns';
import { projects } from '../db/schema/projects';
import { sql } from 'drizzle-orm';
import { MessageStatus } from '../types';

/**
 * Get all messages for admin dashboard
 * GET /api/admin/messages
 */
export async function listAdminMessagesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.query.projectId as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as MessageStatus | undefined;

        const result = await messageService.getAllMessages({
            projectId,
            status,
            limit,
            offset,
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * Get dashboard stats
 * GET /api/admin/stats
 */
export async function getDashboardStatsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Aggregate stats using raw SQL or count queries
        // 1. Total projects
        const [projectsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(projects);

        // 2. Total messages (whatsapp)
        const [messagesCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(whatsappMessages);

        // 3. Total campaigns
        const [campaignsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(campaigns);

        // 4. Messages sent in last 24h
        const [recentMessagesCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(whatsappMessages)
            .where(sql`${whatsappMessages.createdAt} > NOW() - INTERVAL '24 hours'`);

        res.json({
            totalProjects: Number(projectsCount.count),
            totalMessages: Number(messagesCount.count),
            totalCampaigns: Number(campaignsCount.count),
            messagesLast24h: Number(recentMessagesCount.count),
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all campaigns for admin dashboard
 * GET /api/admin/campaigns
 */
export async function listAdminCampaignsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projectId = req.query.projectId as string | undefined;
        // const limit = parseInt(req.query.limit as string) || 50;

        // Simplify for now: get all or filter by project. 
        // We'll use a direct query since campaignService methods are specific to project context
        // or we need to add a method to campaignService.
        // For speed, let's use direct DB query distinct from service if service is restrictive
        // But better to add to service. Let's assume we add getAllCampaigns to campaignService next.
        // actually let's just use the db directly here for the admin view to avoid service bloat for now
        // or add to service. Adding to service is cleaner.

        const result = await campaignService.getAllCampaigns({ projectId });

        res.json({ data: result, count: result.length });
    } catch (error) {
        next(error);
    }
}
