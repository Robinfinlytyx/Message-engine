import { Request, Response, NextFunction } from 'express';
import { db, schema } from '../db/db';
import { eq } from 'drizzle-orm';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

export async function signupController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { orgName, name, email, password } = req.body;

        if (!orgName || !name || !email || !password) {
            res.status(400).json({ error: 'Missing required configuration: orgName, name, email, password' });
            return;
        }

        const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.email, email)
        });

        if (existingUser) {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Simple slug unqiue check
        const existingOrg = await db.query.organizations.findFirst({
            where: eq(schema.organizations.slug, slug)
        });
        
        const finalSlug = existingOrg ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

        const hashedPassword = await authService.hashPassword(password);

        // Transaction for creating org and user
        const result = await db.transaction(async (tx) => {
            const [org] = await tx.insert(schema.organizations).values({
                name: orgName,
                slug: finalSlug,
            }).returning();

            const [user] = await tx.insert(schema.users).values({
                orgId: org.id,
                email,
                name,
                passwordHash: hashedPassword,
                orgRole: 'owner',
            }).returning();

            return { org, user };
        });

        const tokens = await authService.createSession({
            userId: result.user.id,
            orgId: result.org.id,
            userType: 'user',
            role: result.user.orgRole,
        });

        res.status(201).json({
            message: 'Organization and Owner created successfully',
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                orgRole: result.user.orgRole,
                orgId: result.org.id,
                userType: 'user',
            },
            organization: {
                id: result.org.id,
                name: result.org.name,
            },
            ...tokens,
        });

    } catch (error) {
        logger.error('Signup error', { error: error instanceof Error ? error.message : 'Unknown' });
        next(error);
    }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }

        const user = await db.query.users.findFirst({
            where: eq(schema.users.email, email)
        });

        if (!user || user.status !== 'active') {
            res.status(401).json({ error: 'Invalid credentials or inactive account' });
            return;
        }

        const isValid = await authService.verifyPassword(password, user.passwordHash);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const tokens = await authService.createSession({
            userId: user.id,
            orgId: user.orgId,
            userType: 'user',
            role: user.orgRole,
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgRole: user.orgRole,
                orgId: user.orgId,
                userType: 'user',
            },
            ...tokens,
        });

    } catch (error) {
        logger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown' });
        next(error);
    }
}

export async function refreshTokenController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }

        const session = await db.query.userSessions.findFirst({
            where: eq(schema.userSessions.refreshToken, refreshToken)
        });

        if (!session || new Date() > session.expiresAt) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        let payload;

        if (session.userType === 'user') {
            const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.userId) });
            if (!user) {
                res.status(401).json({ error: 'User not found' });
                return;
            }
            payload = { userId: user.id, orgId: user.orgId, userType: 'user' as const, role: user.orgRole };
        } else {
            const superAdmin = await db.query.superAdmins.findFirst({ where: eq(schema.superAdmins.id, session.userId) });
            if (!superAdmin) {
                res.status(401).json({ error: 'Super Admin not found' });
                return;
            }
            payload = { userId: superAdmin.id, userType: 'super_admin' as const };
        }

        // Revoke old and create new
        await authService.revokeSession(refreshToken);
        const tokens = await authService.createSession(payload);

        res.json(tokens);
    } catch (error) {
        next(error);
    }
}

export async function meController(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    
    try {
        if (req.user.userType === 'user') {
            const user = await db.query.users.findFirst({ where: eq(schema.users.id, req.user.userId) });
            const org = req.user.orgId ? await db.query.organizations.findFirst({ where: eq(schema.organizations.id, req.user.orgId) }) : null;
            
            res.json({ user, organization: org });
        } else {
            const sa = await db.query.superAdmins.findFirst({ where: eq(schema.superAdmins.id, req.user.userId) });
            res.json({ superAdmin: sa });
        }
    } catch (error) {
        next(error);
    }
}
