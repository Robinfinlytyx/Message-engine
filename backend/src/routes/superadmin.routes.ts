import { Router } from 'express';
import { superAdminLoginController } from '../controllers/superadmin-auth.controller';
import { getPlatformStatsController, listAllOrgsController } from '../controllers/superadmin.controller';
import { requireAuth } from '../middleware/jwt-auth.middleware';
import { requireSuperAdmin } from '../middleware/superadmin.middleware';

const router = Router();

// Public Super Admin login route
router.post('/login', superAdminLoginController);

// Protected Super Admin actions
router.use(requireAuth, requireSuperAdmin);

router.get('/stats', getPlatformStatsController);
router.get('/organizations', listAllOrgsController);

export const superadminRoutes = router;
