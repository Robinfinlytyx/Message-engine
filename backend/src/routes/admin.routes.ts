import { Router } from 'express';
import {
    listAdminMessagesController,
    getDashboardStatsController,
    listAdminCampaignsController,
} from '../controllers/admin.controller';

const router = Router();

router.get('/messages', listAdminMessagesController);
router.get('/stats', getDashboardStatsController);
router.get('/campaigns', listAdminCampaignsController);

export const adminRoutes = router;
