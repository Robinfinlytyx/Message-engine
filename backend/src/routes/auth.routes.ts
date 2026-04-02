import { Router } from 'express';
import {
    signupController,
    loginController,
    refreshTokenController,
    meController,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/jwt-auth.middleware';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/refresh', refreshTokenController);
router.get('/me', requireAuth, meController);

export const authRoutes = router;
