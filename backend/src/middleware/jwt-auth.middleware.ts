import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.service';
import { logger } from '../utils/logger';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Validates the Authorization Bearer token
 * Stops the request if invalid/missing
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token not found' });
        return;
    }

    const decoded = authService.verifyAccessToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
        return;
    }

    // Attach user to request
    req.user = decoded;
    next();
}

/**
 * Optional Auth - Validates token if present, but allows request if missing
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            const decoded = authService.verifyAccessToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }
    }

    next();
}
