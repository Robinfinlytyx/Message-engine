import { Router } from 'express';
import {
    sendEmailController,
    sendBulkEmailsController,
    getBatchStatusController,
    getFailedEmailsController,
    retryFailedEmailsController,
    getProjectEmailsController,
    getProjectBatchesController,
    createTemplateController,
    getTemplatesController,
    getTemplateController,
    updateTemplateController,
    deleteTemplateController,
} from '../controllers/email.controller';
import { apiKeyAuth } from '../middleware/auth.middleware';

const router = Router();

// Email routes (protected with API key authentication)
router.post('/send', apiKeyAuth, sendEmailController);
router.post('/send-bulk', apiKeyAuth, sendBulkEmailsController);
router.get('/batch/:batchId', apiKeyAuth, getBatchStatusController);
router.get('/batch/:batchId/failed', apiKeyAuth, getFailedEmailsController);
router.post('/batch/:batchId/retry', apiKeyAuth, retryFailedEmailsController);

// Project specific email routes
router.get('/project/:projectId', getProjectEmailsController);
router.get('/project/:projectId/batches', getProjectBatchesController);

// Template routes
router.post('/templates', apiKeyAuth, createTemplateController);
router.get('/templates', apiKeyAuth, getTemplatesController);
router.get('/templates/:templateId', apiKeyAuth, getTemplateController);
router.put('/templates/:templateId', apiKeyAuth, updateTemplateController);
router.delete('/templates/:templateId', apiKeyAuth, deleteTemplateController);

export const emailRoutes = router;
