import crypto from 'crypto';
import { db, schema } from '../db/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface ProjectContext {
    id: string;
    name: string;
    status: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    orgId: string;
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
            orgId: request.orgId,
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
     * Get project by ID (scoped to org)
     */
    async getProjectById(id: string, orgId?: string): Promise<ProjectResponse | null> {
        const conditions = [eq(schema.projects.id, id)];
        if (orgId) {
            conditions.push(eq(schema.projects.orgId, orgId));
        }
        
        const project = await db.query.projects.findFirst({
            where: and(...conditions),
        });

        return project || null;
    }

    /**
     * List all projects (scoped to org)
     */
    async listProjects(orgId?: string): Promise<ProjectResponse[]> {
        return db.query.projects.findMany({
            where: orgId ? eq(schema.projects.orgId, orgId) : undefined,
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        });
    }

    /**
     * Update project status (active/suspended)
     */
    async updateProjectStatus(id: string, status: 'active' | 'suspended', orgId?: string): Promise<ProjectResponse | null> {
        const conditions = [eq(schema.projects.id, id)];
        if (orgId) conditions.push(eq(schema.projects.orgId, orgId));

        const [updated] = await db
            .update(schema.projects)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(and(...conditions))
            .returning();

        if (updated) {
            logger.info('Project status updated', { projectId: id, status });
        }

        return updated || null;
    }

    /**
     * Regenerate API key for a project
     */
    async regenerateApiKey(id: string, orgId?: string): Promise<ProjectResponse | null> {
        const newApiKey = this.generateApiKey();
        
        const conditions = [eq(schema.projects.id, id)];
        if (orgId) conditions.push(eq(schema.projects.orgId, orgId));

        const [updated] = await db
            .update(schema.projects)
            .set({
                apiKey: newApiKey,
                updatedAt: new Date(),
            })
            .where(and(...conditions))
            .returning();

        if (updated) {
            logger.info('Project API key regenerated', { projectId: id });
        }

        return updated || null;
    }
}

export const projectService = new ProjectService();
