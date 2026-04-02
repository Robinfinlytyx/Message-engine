import { Request, Response, NextFunction } from 'express';
import { db, schema } from '../db/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Super Admin endpoints to view global platform stats
 */
export async function getPlatformStatsController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [orgsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.organizations);
        const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
        const [projectsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.projects);
        const [messagesCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.whatsappMessages);

        res.json({
            totalOrganizations: Number(orgsCount.count),
            totalUsers: Number(usersCount.count),
            totalProjects: Number(projectsCount.count),
            totalMessages: Number(messagesCount.count),
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List all organizations
 */
export async function listAllOrgsController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const orgs = await db.query.organizations.findMany({
            orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
        });
        
        // Count users per org would ideally be a separate query or join
        
        res.json({ data: orgs });
    } catch (error) {
        next(error);
    }
}
