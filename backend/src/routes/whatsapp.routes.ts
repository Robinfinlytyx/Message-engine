import { Router } from 'express';
import {
    sendTemplateController,
    webhookController,
    getTemplatesController,
    syncTemplatesController,
    createTemplateController,
    sendBulkMessageController,
} from '../controllers/whatsapp.controller';
import { apiKeyAuth } from '../middleware/auth.middleware';

const router = Router();

// API Routes (protected with API key authentication)
router.post('/api/whatsapp/send-template', apiKeyAuth, sendTemplateController);

// Template Management (protected)
router.get('/api/whatsapp/templates', apiKeyAuth, getTemplatesController);
router.post('/api/whatsapp/templates/sync', apiKeyAuth, syncTemplatesController);
router.post('/api/whatsapp/templates', apiKeyAuth, createTemplateController);

// Bulk Messaging (protected)
router.post('/api/whatsapp/notify', apiKeyAuth, sendBulkMessageController);

// Webhook Routes (not protected - called by Telinfy)
router.post('/webhooks/whatsapp', webhookController);

export default router;
