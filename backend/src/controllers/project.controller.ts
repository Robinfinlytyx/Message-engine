import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { logger } from '../utils/logger';

/**
 * Register a new project
 * POST /api/admin/projects
 */
export async function registerProjectController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Missing required field: name' });
            return;
        }

        const project = await projectService.registerProject({ name, description });

        res.status(201).json({
            id: project.id,
            name: project.name,
            description: project.description,
            apiKey: project.apiKey,
            status: project.status,
            createdAt: project.createdAt,
            message: 'Project registered successfully. Store the API key securely - it will be needed for all API requests.',
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('unique constraint')) {
            res.status(409).json({ error: 'Project name already exists' });
            return;
        }
        next(error);
    }
}

/**
 * List all projects
 * GET /api/admin/projects
 */
export async function listProjectsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const projects = await projectService.listProjects();

        // Mask API keys for security
        const maskedProjects = projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            apiKey: `${p.apiKey.substring(0, 8)}...${p.apiKey.substring(p.apiKey.length - 4)}`,
            status: p.status,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));

        res.json({ data: maskedProjects });
    } catch (error) {
        next(error);
    }
}

/**
 * Get project by ID
 * GET /api/admin/projects/:id
 */
export async function getProjectController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const project = await projectService.getProjectById(id);

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Mask API key for security
        res.json({
            id: project.id,
            name: project.name,
            description: project.description,
            apiKey: `${project.apiKey.substring(0, 8)}...${project.apiKey.substring(project.apiKey.length - 4)}`,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update project status
 * PATCH /api/admin/projects/:id/status
 */
export async function updateProjectStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!status || !['active', 'suspended'].includes(status)) {
            res.status(400).json({
                error: 'Invalid status. Must be "active" or "suspended"'
            });
            return;
        }

        const project = await projectService.updateProjectStatus(id, status);

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json({
            id: project.id,
            name: project.name,
            status: project.status,
            message: `Project status updated to ${status}`,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get full API key for a project (admin only)
 * GET /api/admin/projects/:id/api-key
 */
export async function getApiKeyController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const project = await projectService.getProjectById(id);

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Return full API key (only for admin access)
        res.json({
            apiKey: project.apiKey,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Regenerate API key for a project
 * POST /api/admin/projects/:id/regenerate-key
 */
export async function regenerateApiKeyController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const project = await projectService.regenerateApiKey(id);

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        logger.warn('API key regenerated - old key is now invalid', {
            projectId: id,
            projectName: project.name
        });

        res.json({
            id: project.id,
            name: project.name,
            apiKey: project.apiKey,
            message: 'API key regenerated. Update all services using this project.',
        });
    } catch (error) {
        next(error);
    }
}
