import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';
import { teamService } from '../services/team.service';
import { projectService } from '../services/project.service';
import { campaignService } from '../services/campaign.service';
import { db } from '../db/db';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { campaigns } from '../db/schema/campaigns';
import { projects } from '../db/schema/projects';
import { sql, inArray, and } from 'drizzle-orm';
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
        const orgId = req.user!.orgId!;
        const orgRole = req.user!.role || 'member';
        
        // Scope directly to user's assigned projects
        const accessibleProjects = await teamService.getUserAccessibleProjects(req.user!.userId, orgId, orgRole);

        if (accessibleProjects.length === 0) {
            res.json({ data: [], count: 0 });
            return;
        }

        const projectId = req.query.projectId as string | undefined;
        
        if (projectId && !accessibleProjects.includes(projectId)) {
            res.status(403).json({ error: 'Access denied: not assigned to this project' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as MessageStatus | undefined;

        // If specific projectId is requested, we use it. Otherwise, we filter by arrays of accessible projects.
        const projectIdsToQuery = projectId ? undefined : accessibleProjects;

        const result = await messageService.getAllMessages({
            projectId,
            projectIds: projectIdsToQuery,
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
        const orgId = req.user!.orgId!;
        const orgRole = req.user!.role || 'member';
        
        const accessibleProjects = await teamService.getUserAccessibleProjects(req.user!.userId, orgId, orgRole);

        if (accessibleProjects.length === 0) {
            res.json({
                totalProjects: 0,
                totalMessages: 0,
                totalCampaigns: 0,
                messagesLast24h: 0,
            });
            return;
        }

        // Aggregate stats scoped by accessible projects
        const [projectsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(projects)
            .where(inArray(projects.id, accessibleProjects));

        const [messagesCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(whatsappMessages)
            .where(inArray(whatsappMessages.projectId, accessibleProjects));

        const [campaignsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(campaigns)
            .where(inArray(campaigns.projectId, accessibleProjects));

        const [recentMessagesCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(whatsappMessages)
            .where(and(
                inArray(whatsappMessages.projectId, accessibleProjects),
                sql`${whatsappMessages.createdAt} > NOW() - INTERVAL '24 hours'`
            ));

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
        const orgId = req.user!.orgId!;
        const orgRole = req.user!.role || 'member';
        
        const accessibleProjects = await teamService.getUserAccessibleProjects(req.user!.userId, orgId, orgRole);

        if (accessibleProjects.length === 0) {
            res.json({ data: [], count: 0 });
            return;
        }

        const projectId = req.query.projectId as string | undefined;

        if (projectId && !accessibleProjects.includes(projectId)) {
            res.status(403).json({ error: 'Access denied: not assigned to this project' });
            return;
        }

        const projectIdsToQuery = projectId ? undefined : accessibleProjects;

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await campaignService.getAllCampaigns({ 
            projectId,
            projectIds: projectIdsToQuery,
            limit,
            offset,
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
}
