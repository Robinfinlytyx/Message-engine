import { Router } from 'express';
import {
    listAdminMessagesController,
    getDashboardStatsController,
    listAdminCampaignsController,
} from '../controllers/admin.controller';
import { requireAuth } from '../middleware/jwt-auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/messages', listAdminMessagesController);
router.get('/stats', getDashboardStatsController);
router.get('/campaigns', listAdminCampaignsController);

export const adminRoutes = router;
