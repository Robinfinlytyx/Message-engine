import { Request, Response, NextFunction } from 'express';

/**
 * Ensures the authenticated user belongs to an organization.
 * Used for tenant-specific routes.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.userType !== 'user' || !req.user.orgId) {
        res.status(403).json({ error: 'Access denied: requires organization context' });
        return;
    }
    next();
}

/**
 * Validates that the user has specific roles within their organization.
 */
export function requireOrgRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.userType !== 'user' || !req.user.orgId) {
            res.status(403).json({ error: 'Access denied: requires organization context' });
            return;
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Access denied: insufficient permissions within organization' });
            return;
        }

        next();
    };
}
