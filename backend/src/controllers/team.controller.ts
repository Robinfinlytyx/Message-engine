import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';

export async function inviteUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, orgRole } = req.body;
        const orgId = req.user!.orgId!;
        const invitedById = req.user!.userId;

        if (!email || !orgRole) {
            res.status(400).json({ error: 'Email and orgRole are required' });
            return;
        }

        const token = await teamService.inviteUser({
            orgId,
            invitedById,
            email,
            orgRole,
        });

        res.status(201).json({
            message: 'Invitation created successfully',
            token, // Only returning token in response for dev purposes. In prod, email it.
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }
        next(error);
    }
}

export async function getTeamController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const orgId = req.user!.orgId!;
        const members = await teamService.getTeamMembers(orgId);
        const pendingInvites = await teamService.getPendingInvitations(orgId);

        res.json({
            members,
            pendingInvites,
        });
    } catch (error) {
        next(error);
    }
}

export async function removeUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const orgId = req.user!.orgId!;
        const userIdToRemove = req.params.userId as string;

        // Prevent self-removal through this endpoint
        if (req.user!.userId === userIdToRemove) {
            res.status(400).json({ error: 'Cannot remove yourself using this endpoint' });
            return;
        }

        const success = await teamService.removeUser(orgId, userIdToRemove);

        if (!success) {
            res.status(404).json({ error: 'User not found in this organization' });
            return;
        }

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        next(error);
    }
}
