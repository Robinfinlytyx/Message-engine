import crypto from 'crypto';
import { db, schema } from '../db/db';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface ProjectContext {
    id: string;
    name: string;
    status: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
}

export interface ProjectResponse {
    id: string;
    name: string;
    description: string | null;
    apiKey: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

class ProjectService {
    /**
     * Generate a secure API key
     */
    private generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Register a new project
     */
    async registerProject(request: CreateProjectRequest): Promise<ProjectResponse> {
        const apiKey = this.generateApiKey();

        logger.info('Registering new project', { name: request.name });

        const [project] = await db.insert(schema.projects).values({
            name: request.name,
            description: request.description || null,
            apiKey,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        logger.info('Project registered successfully', {
            projectId: project.id,
            name: project.name
        });

        return project;
    }

    /**
     * Validate an API key and return project context if valid
     */
    async validateApiKey(apiKey: string): Promise<ProjectContext | null> {
        const project = await db.query.projects.findFirst({
            where: eq(schema.projects.apiKey, apiKey),
        });

        if (!project) {
            return null;
        }

        if (project.status !== 'active') {
            logger.warn('Attempted access with suspended project', {
                projectId: project.id,
                name: project.name
            });
            return null;
        }

        return {
            id: project.id,
            name: project.name,
            status: project.status,
        };
    }

    /**
     * Get project by ID
     */
    async getProjectById(id: string): Promise<ProjectResponse | null> {
        const project = await db.query.projects.findFirst({
            where: eq(schema.projects.id, id),
        });

        return project || null;
    }

    /**
     * List all projects
     */
    async listProjects(): Promise<ProjectResponse[]> {
        return db.query.projects.findMany({
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        });
    }

    /**
     * Update project status (active/suspended)
     */
    async updateProjectStatus(id: string, status: 'active' | 'suspended'): Promise<ProjectResponse | null> {
        const [updated] = await db
            .update(schema.projects)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(schema.projects.id, id))
            .returning();

        if (updated) {
            logger.info('Project status updated', { projectId: id, status });
        }

        return updated || null;
    }

    /**
     * Regenerate API key for a project
     */
    async regenerateApiKey(id: string): Promise<ProjectResponse | null> {
        const newApiKey = this.generateApiKey();

        const [updated] = await db
            .update(schema.projects)
            .set({
                apiKey: newApiKey,
                updatedAt: new Date(),
            })
            .where(eq(schema.projects.id, id))
            .returning();

        if (updated) {
            logger.info('Project API key regenerated', { projectId: id });
        }

        return updated || null;
    }
}

export const projectService = new ProjectService();
