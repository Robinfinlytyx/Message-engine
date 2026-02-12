import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth.middleware';
import {
    createCampaignController,
    listCampaignsController,
    getCampaignController,
} from '../controllers/campaign.controller';

const router = Router();

// All campaign routes require API key authentication
router.use(apiKeyAuth);

// Create a new campaign
router.post('/campaign', createCampaignController);

// List campaigns for the authenticated project
router.get('/campaigns', listCampaignsController);

// Get a specific campaign by ID
router.get('/campaign/:id', getCampaignController);

export const campaignRoutes = router;
