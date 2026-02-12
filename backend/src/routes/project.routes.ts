import { Router } from 'express';
import {
    registerProjectController,
    listProjectsController,
    getProjectController,
    updateProjectStatusController,
    getApiKeyController,
    regenerateApiKeyController,
} from '../controllers/project.controller';

const router = Router();

// Project management routes (admin only)
// NOTE: More specific routes must come before generic :id routes
router.post('/api/admin/projects', registerProjectController);
router.get('/api/admin/projects', listProjectsController);
router.get('/api/admin/projects/:id/api-key', getApiKeyController);
router.post('/api/admin/projects/:id/regenerate-key', regenerateApiKeyController);
router.patch('/api/admin/projects/:id/status', updateProjectStatusController);
router.get('/api/admin/projects/:id', getProjectController);

export default router;
