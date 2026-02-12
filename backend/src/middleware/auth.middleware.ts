import { Request, Response, NextFunction } from 'express';
import { projectService, ProjectContext } from '../services/project.service';
import { logger } from '../utils/logger';

// Extend Express Request type to include project context
declare global {
    namespace Express {
        interface Request {
            project?: ProjectContext;
        }
    }
}

/**
 * API Key authentication middleware
 * Extracts X-API-Key header, validates it, and attaches project context to request
 */
export async function apiKeyAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
        logger.warn('Request missing API key', {
            path: req.path,
            method: req.method
        });
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing X-API-Key header'
        });
        return;
    }

    try {
        const project = await projectService.validateApiKey(apiKey);

        if (!project) {
            logger.warn('Invalid or suspended API key used', {
                path: req.path,
                method: req.method
            });
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or suspended API key'
            });
            return;
        }

        // Attach project context to request
        req.project = project;

        logger.info('Request authenticated', {
            projectId: project.id,
            projectName: project.name,
            path: req.path
        });

        next();
    } catch (error) {
        logger.error('Error during API key validation', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({ error: 'Internal server error' });
    }
}
