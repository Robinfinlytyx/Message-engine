import { db } from '../db/db';
import { projectConfigurations, ProjectConfigInsert, ProjectConfigSelect } from '../db/schema/project_configurations';
import { eq } from 'drizzle-orm';
import { cryptoService } from '../utils/crypto';
import { config } from '../config';
import { logger } from '../utils/logger';

// Fields that are stored encrypted in the database
const ENCRYPTED_FIELDS: (keyof ProjectConfigInsert)[] = ['telinfyApiKey', 'smtpPassword', 'telinfyAccessId'];

/**
 * Decrypted project configuration — the shape services actually work with.
 * Same as ProjectConfigSelect but with plaintext secrets.
 */
export type DecryptedProjectConfig = ProjectConfigSelect;

/**
 * Input shape for creating/updating project config (plaintext secrets).
 */
export interface ProjectConfigInput {
    whatsappEnabled?: boolean;
    telinfyApiKey?: string;
    telinfyWhatsappBusinessId?: string;
    telinfyAccessId?: string;
    telinfyPhoneNumberId?: string;
    telinfyUserName?: string;
    telinfyBusinessAccountId?: string;
    emailEnabled?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    defaultFromEmail?: string;
    defaultFromName?: string;
    emailBatchSize?: number;
    emailMaxRetries?: number;
    emailRateLimitMax?: number;
    emailRateLimitDuration?: number;
}

/**
 * Resolved configuration — merges project-specific config with global defaults.
 * This is the final shape that providers use.
 */
export interface ResolvedTelinfyConfig {
    apiKey: string;
    baseUrl: string;
    fileUrl: string;
    whatsAppBusinessId: string;
    accessId?: string | null;
    phoneNumberId?: string | null;
    userName?: string | null;
    businessAccountId?: string | null;
}

export interface ResolvedSmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    defaultFromEmail: string;
    defaultFromName: string;
}

class ProjectConfigService {
    /**
     * Get the raw (decrypted) config for a project, or null if none exists.
     */
    async getConfig(projectId: string): Promise<DecryptedProjectConfig | null> {
        const row = await db.query.projectConfigurations.findFirst({
            where: eq(projectConfigurations.projectId, projectId),
        });

        if (!row) return null;

        return this.decryptRow(row);
    }

    /**
     * Get the raw config, but with secrets masked for API responses.
     */
    async getConfigMasked(projectId: string): Promise<Record<string, unknown> | null> {
        const row = await db.query.projectConfigurations.findFirst({
            where: eq(projectConfigurations.projectId, projectId),
        });

        if (!row) return null;

        const decrypted = this.decryptRow(row);

        return {
            ...decrypted,
            telinfyApiKey: decrypted.telinfyApiKey ? cryptoService.mask(decrypted.telinfyApiKey) : null,
            smtpPassword: decrypted.smtpPassword ? cryptoService.mask(decrypted.smtpPassword) : null,
            telinfyAccessId: decrypted.telinfyAccessId ? cryptoService.mask(decrypted.telinfyAccessId) : null,
        };
    }

    /**
     * Create a new project configuration.
     */
    async createConfig(projectId: string, input: ProjectConfigInput): Promise<DecryptedProjectConfig> {
        logger.info('Creating project configuration', { projectId });

        const insertData = this.prepareInsertData(projectId, input);

        const [row] = await db.insert(projectConfigurations)
            .values(insertData)
            .returning();

        logger.info('Project configuration created', { projectId, configId: row.id });
        return this.decryptRow(row);
    }

    /**
     * Update an existing project configuration.
     */
    async updateConfig(projectId: string, input: ProjectConfigInput): Promise<DecryptedProjectConfig | null> {
        logger.info('Updating project configuration', { projectId });

        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        // Only set fields that are provided
        for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) {
                if (ENCRYPTED_FIELDS.includes(key as keyof ProjectConfigInsert) && typeof value === 'string') {
                    updateData[key] = cryptoService.encrypt(value);
                } else {
                    updateData[key] = value;
                }
            }
        }

        const [row] = await db.update(projectConfigurations)
            .set(updateData)
            .where(eq(projectConfigurations.projectId, projectId))
            .returning();

        if (!row) return null;

        logger.info('Project configuration updated', { projectId });
        return this.decryptRow(row);
    }

    /**
     * Upsert — create or update project configuration.
     */
    async upsertConfig(projectId: string, input: ProjectConfigInput): Promise<DecryptedProjectConfig> {
        const existing = await db.query.projectConfigurations.findFirst({
            where: eq(projectConfigurations.projectId, projectId),
        });

        if (existing) {
            const result = await this.updateConfig(projectId, input);
            return result!;
        } else {
            return this.createConfig(projectId, input);
        }
    }

    /**
     * Delete project configuration (project reverts to global defaults).
     */
    async deleteConfig(projectId: string): Promise<boolean> {
        const result = await db.delete(projectConfigurations)
            .where(eq(projectConfigurations.projectId, projectId))
            .returning();

        return result.length > 0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESOLVED CONFIG — merges project config with global defaults
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Resolve the Telinfy config for a project.
     * Falls back to .env defaults if the project has no specific config.
     */
    async resolveTelinfyConfig(projectId: string): Promise<ResolvedTelinfyConfig> {
        const projectConfig = await this.getConfig(projectId);

        return {
            apiKey: projectConfig?.telinfyApiKey || config.telinfy.apiKey,
            baseUrl: config.telinfy.baseUrl,
            fileUrl: config.telinfy.fileUrl,
            whatsAppBusinessId: projectConfig?.telinfyWhatsappBusinessId || config.telinfy.whatsAppBusinessId,
            accessId: projectConfig?.telinfyAccessId || null,
            phoneNumberId: projectConfig?.telinfyPhoneNumberId || null,
            userName: projectConfig?.telinfyUserName || null,
            businessAccountId: projectConfig?.telinfyBusinessAccountId || null,
        };
    }

    /**
     * Resolve the SMTP config for a project.
     * Falls back to .env defaults if the project has no specific config.
     */
    async resolveSmtpConfig(projectId: string): Promise<ResolvedSmtpConfig> {
        const projectConfig = await this.getConfig(projectId);

        return {
            host: projectConfig?.smtpHost || config.smtp.host,
            port: projectConfig?.smtpPort || config.smtp.port,
            secure: projectConfig?.smtpSecure ?? config.smtp.secure,
            user: projectConfig?.smtpUser || config.smtp.user,
            password: projectConfig?.smtpPassword || config.smtp.password,
            defaultFromEmail: projectConfig?.defaultFromEmail || config.smtp.defaultFromEmail,
            defaultFromName: projectConfig?.defaultFromName || config.smtp.defaultFromName,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private prepareInsertData(projectId: string, input: ProjectConfigInput): ProjectConfigInsert {
        const data: ProjectConfigInsert = {
            projectId,
            whatsappEnabled: input.whatsappEnabled ?? false,
            emailEnabled: input.emailEnabled ?? false,
            telinfyWhatsappBusinessId: input.telinfyWhatsappBusinessId || null,
            telinfyPhoneNumberId: input.telinfyPhoneNumberId || null,
            telinfyUserName: input.telinfyUserName || null,
            telinfyBusinessAccountId: input.telinfyBusinessAccountId || null,
            smtpHost: input.smtpHost || null,
            smtpPort: input.smtpPort || null,
            smtpSecure: input.smtpSecure ?? true,
            smtpUser: input.smtpUser || null,
            defaultFromEmail: input.defaultFromEmail || null,
            defaultFromName: input.defaultFromName || null,
            emailBatchSize: input.emailBatchSize || 100,
            emailMaxRetries: input.emailMaxRetries || 3,
            emailRateLimitMax: input.emailRateLimitMax || 100,
            emailRateLimitDuration: input.emailRateLimitDuration || 1000,
        };

        // Encrypt sensitive fields
        if (input.telinfyApiKey) {
            data.telinfyApiKey = cryptoService.encrypt(input.telinfyApiKey);
        }
        if (input.telinfyAccessId) {
            data.telinfyAccessId = cryptoService.encrypt(input.telinfyAccessId);
        }
        if (input.smtpPassword) {
            data.smtpPassword = cryptoService.encrypt(input.smtpPassword);
        }

        return data;
    }

    private decryptRow(row: ProjectConfigSelect): DecryptedProjectConfig {
        return {
            ...row,
            telinfyApiKey: row.telinfyApiKey ? cryptoService.decrypt(row.telinfyApiKey) : null,
            telinfyAccessId: row.telinfyAccessId ? cryptoService.decrypt(row.telinfyAccessId) : null,
            smtpPassword: row.smtpPassword ? cryptoService.decrypt(row.smtpPassword) : null,
        };
    }
}

export const projectConfigService = new ProjectConfigService();
