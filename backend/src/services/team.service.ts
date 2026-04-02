import { db, schema } from '../db/db';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface InviteRequest {
    orgId: string;
    invitedById: string;
    email: string;
    orgRole: 'admin' | 'member' | 'viewer';
}

export class TeamService {
    /**
     * Invite a user to an organization
     */
    async inviteUser(req: InviteRequest): Promise<string> {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: and(eq(schema.users.email, req.email), eq(schema.users.orgId, req.orgId))
        });

        if (existingUser) {
            throw new Error('User already exists in this organization');
        }

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        await db.insert(schema.invitations).values({
            orgId: req.orgId,
            invitedBy: req.invitedById,
            email: req.email,
            orgRole: req.orgRole,
            token,
            status: 'pending',
            expiresAt,
        });

        // In a real app, send an email here with a link like:
        // https://app.communicationengine.com/invite/[token]
        logger.info('Invitation created', { email: req.email, role: req.orgRole, orgId: req.orgId });

        return token;
    }

    /**
     * Get pending invitations for an organization
     */
    async getPendingInvitations(orgId: string) {
        return db.query.invitations.findMany({
            where: and(
                eq(schema.invitations.orgId, orgId),
                eq(schema.invitations.status, 'pending')
            ),
            orderBy: (invites, { desc }) => [desc(invites.createdAt)],
        });
    }

    /**
     * Remove a user from an organization
     */
    async removeUser(orgId: string, userId: string): Promise<boolean> {
        // Find user
        const user = await db.query.users.findFirst({
            where: and(eq(schema.users.id, userId), eq(schema.users.orgId, orgId))
        });

        if (!user) return false;

        // Don't allow removing owner if they are the only owner
        // Simplified: assuming owner deletion prevention is handled at controller level.
        
        const [deleted] = await db.delete(schema.users)
            .where(and(eq(schema.users.id, userId), eq(schema.users.orgId, orgId)))
            .returning();
            
        return !!deleted;
    }

    /**
     * Get accessible projects for a user
     */
    async getUserAccessibleProjects(userId: string, orgId: string, orgRole: string): Promise<string[]> {
        // Owners and Admins can access ALL projects in their org
        if (orgRole === 'owner' || orgRole === 'admin') {
            const projects = await db.query.projects.findMany({
                where: eq(schema.projects.orgId, orgId),
                columns: { id: true }
            });
            return projects.map(p => p.id);
        }

        // Members and Viewers can only access explicitly assigned projects
        const assignments = await db.query.userProjectAssignments.findMany({
            where: eq(schema.userProjectAssignments.userId, userId),
            columns: { projectId: true }
        });
        
        return assignments.map(a => a.projectId);
    }

    /**
     * List team members
     */
    async getTeamMembers(orgId: string) {
        return db.query.users.findMany({
            where: eq(schema.users.orgId, orgId),
            columns: {
                id: true,
                email: true,
                name: true,
                orgRole: true,
                status: true,
                createdAt: true,
            },
            orderBy: (users, { desc }) => [desc(users.createdAt)],
        });
    }
}

export const teamService = new TeamService();
