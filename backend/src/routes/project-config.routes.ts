import { Router } from 'express';
import {
    getProjectConfigController,
    upsertProjectConfigController,
    deleteProjectConfigController,
    testWhatsAppConfigController,
    testEmailConfigController,
} from '../controllers/project-config.controller';

const router = Router();

// Project configuration management routes (admin)
// Test endpoints must come before the generic :projectId/config routes
router.post('/api/admin/projects/:projectId/config/test-whatsapp', testWhatsAppConfigController);
router.post('/api/admin/projects/:projectId/config/test-email', testEmailConfigController);
router.get('/api/admin/projects/:projectId/config', getProjectConfigController);
router.put('/api/admin/projects/:projectId/config', upsertProjectConfigController);
router.delete('/api/admin/projects/:projectId/config', deleteProjectConfigController);

export { router as projectConfigRoutes };
