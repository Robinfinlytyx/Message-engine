import { Request, Response, NextFunction } from 'express';
import { db, schema } from '../db/db';
import { eq } from 'drizzle-orm';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

export async function superAdminLoginController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }

        const admin = await db.query.superAdmins.findFirst({
            where: eq(schema.superAdmins.email, email)
        });

        if (!admin || admin.status !== 'active') {
            res.status(401).json({ error: 'Invalid credentials or inactive account' });
            return;
        }

        const isValid = await authService.verifyPassword(password, admin.passwordHash);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const tokens = await authService.createSession({
            userId: admin.id,
            userType: 'super_admin',
        });

        res.json({
            message: 'Super Admin login successful',
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                userType: 'super_admin',
            },
            ...tokens,
        });

    } catch (error) {
        logger.error('Super Admin Login error', { error: error instanceof Error ? error.message : 'Unknown' });
        next(error);
    }
}
