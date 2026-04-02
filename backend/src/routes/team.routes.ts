import { Router } from 'express';
import {
    inviteUserController,
    getTeamController,
    removeUserController,
} from '../controllers/team.controller';
import { requireAuth } from '../middleware/jwt-auth.middleware';
import { requireTenant, requireOrgRole } from '../middleware/tenant.middleware';

const router = Router();

// Protect all routes
router.use(requireAuth, requireTenant);

// Only 'owner' and 'admin' can manage the team
router.post('/invite', requireOrgRole(['owner', 'admin']), inviteUserController);
router.delete('/:userId', requireOrgRole(['owner', 'admin']), removeUserController);

// All org members can view the team directory
router.get('/', getTeamController);

export const teamRoutes = router;
