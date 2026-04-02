import { Request, Response, NextFunction } from 'express';

/**
 * Restricts access to super admins only.
 * Used for platform-level management routes.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.userType !== 'super_admin') {
        res.status(403).json({ error: 'Access denied: super admin privileges required' });
        return;
    }
    next();
}
