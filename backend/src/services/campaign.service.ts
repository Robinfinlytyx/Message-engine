import { db } from '../db/db';
import { campaigns, CampaignInsert } from '../db/schema/campaigns';
import { eq } from 'drizzle-orm';
import { telinfyProvider } from '../providers/telinfy.provider';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface CampaignMessage {
    to: string;
    templateName: string;
    language: string;
    header?: Record<string, unknown> | null;
    body?: Record<string, unknown> | null;
    button?: Record<string, unknown>[] | null;
}

export interface CreateCampaignRequest {
    name: string;
    messages: CampaignMessage[];
    scheduleTime?: string;
    channelGroupId?: number;
}

export interface CreateCampaignResponse {
    id: string;
    name: string;
    status: string;
    messageCount: number;
    scheduleTime?: string;
    telinfyCampaignId?: string;
}

class CampaignService {
    private readonly channelId: string;

    constructor() {
        // Get WhatsApp Business ID from config
        this.channelId = config.telinfy.whatsAppBusinessId || '';
    }

    /**
     * Create a new campaign
     * 1. Store campaign in database with pending status
     * 2. Upload messages file to Telinfy
     * 3. Create campaign on Telinfy
     * 4. Update campaign with Telinfy response
     */
    async createCampaign(
        projectId: string,
        request: CreateCampaignRequest
    ): Promise<CreateCampaignResponse> {
        const { name, messages, scheduleTime, channelGroupId = 3 } = request;

        logger.info('Creating campaign', {
            projectId,
            name,
            messageCount: messages.length,
        });

        // Validate
        if (!messages || messages.length === 0) {
            throw new Error('Campaign must have at least one message');
        }

        if (!this.channelId) {
            throw new Error('WhatsApp Business ID not configured');
        }

        let parsedScheduleTime: Date | null = null;
        if (scheduleTime) {
            // Try standard parsing first
            parsedScheduleTime = new Date(scheduleTime);

            // If invalid, try to normalize format (e.g. 2026-2-6 -> 2026-02-06)
            if (isNaN(parsedScheduleTime.getTime())) {
                try {
                    const parts = scheduleTime.split('T');
                    const dateParts = parts[0].split('-');
                    if (dateParts.length === 3) {
                        const year = dateParts[0];
                        const month = dateParts[1].padStart(2, '0');
                        const day = dateParts[2].padStart(2, '0');
                        const timePart = parts[1] || '00:00:00Z';

                        const normalizedTime = `${year}-${month}-${day}T${timePart}`;
                        logger.info(`Normalizing invalid date: ${scheduleTime} -> ${normalizedTime}`);
                        parsedScheduleTime = new Date(normalizedTime);
                    }
                } catch (e) {
                    // Ignore parsing errors here, validation below will catch it
                }
            }

            if (!parsedScheduleTime || isNaN(parsedScheduleTime.getTime())) {
                throw new Error(`Invalid scheduleTime format: "${scheduleTime}". Use ISO 8601 (e.g. 2026-02-06T10:00:00Z)`);
            }
        }

        // Step 1: Create campaign record in database
        const [campaign] = await db.insert(campaigns).values({
            projectId,
            name,
            channelId: this.channelId,
            channelGroupId,
            status: 'pending',
            messageCount: messages.length,
            scheduleTime: parsedScheduleTime,
            messagesPayload: messages as unknown as Array<Record<string, unknown>>,
        }).returning();

        try {
            // Step 2: Upload messages file to Telinfy
            await db.update(campaigns)
                .set({ status: 'uploading', updatedAt: new Date() })
                .where(eq(campaigns.id, campaign.id));

            const fileUploadResult = await telinfyProvider.uploadCampaignFile(
                messages as unknown as Array<Record<string, unknown>>,
                this.channelId
            );

            // Update campaign with file ID
            await db.update(campaigns)
                .set({
                    fileId: fileUploadResult.fileId,
                    updatedAt: new Date(),
                })
                .where(eq(campaigns.id, campaign.id));

            // Step 3: Create campaign on Telinfy
            const campaignScheduleTime = scheduleTime || new Date().toISOString();

            const telinfyResult = await telinfyProvider.createCampaign({
                channelId: this.channelId,
                campaignId: fileUploadResult.fileId,
                campaignName: name,
                channelGroupId,
                scheduleTime: campaignScheduleTime,
                campaignMessageCount: messages.length,
            });

            // Step 4: Update campaign with Telinfy response
            await db.update(campaigns)
                .set({
                    telinfyCampaignId: telinfyResult.campaignId,
                    status: telinfyResult.status.toLowerCase(),
                    telinfyResponse: telinfyResult as unknown as Record<string, unknown>,
                    updatedAt: new Date(),
                })
                .where(eq(campaigns.id, campaign.id));

            logger.info('Campaign created successfully', {
                campaignId: campaign.id,
                telinfyCampaignId: telinfyResult.campaignId,
            });

            return {
                id: campaign.id,
                name,
                status: telinfyResult.status.toLowerCase(),
                messageCount: messages.length,
                scheduleTime: campaignScheduleTime,
                telinfyCampaignId: telinfyResult.campaignId,
            };
        } catch (error) {
            // Update campaign with error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await db.update(campaigns)
                .set({
                    status: 'failed',
                    error: { message: errorMessage },
                    updatedAt: new Date(),
                })
                .where(eq(campaigns.id, campaign.id));

            logger.error('Campaign creation failed', {
                campaignId: campaign.id,
                error: errorMessage,
            });

            throw error;
        }
    }

    /**
     * Get campaigns by project
     */
    async getCampaignsByProject(projectId: string, limit: number = 50) {
        return db.select()
            .from(campaigns)
            .where(eq(campaigns.projectId, projectId))
            .orderBy(campaigns.createdAt)
            .limit(limit);
    }

    /**
     * Get campaign by ID
     */
    async getCampaignById(id: string) {
        const [campaign] = await db.select()
            .from(campaigns)
            .where(eq(campaigns.id, id))
            .limit(1);
        return campaign || null;
    }

    /**
     * Get all campaigns (admin) with filtering
     */
    async getAllCampaigns(params: { projectId?: string; limit?: number }) {
        const { projectId, limit = 50 } = params;

        let query = db.select().from(campaigns).orderBy(campaigns.createdAt);

        if (projectId) {
            // @ts-ignore - Dynamic where clause simple implementation
            query = query.where(eq(campaigns.projectId, projectId));
        }

        // Limit not directly chainable in all query builders the same way with conditional where 
        // Re-writing for safety
        if (projectId) {
            return db.select()
                .from(campaigns)
                .where(eq(campaigns.projectId, projectId))
                .orderBy(campaigns.createdAt)
                .limit(limit);
        } else {
            return db.select()
                .from(campaigns)
                .orderBy(campaigns.createdAt)
                .limit(limit);
        }
    }

    /**
     * Get campaign by ID with project validation
     */
    async getCampaignByIdForProject(id: string, projectId: string) {
        const campaign = await this.getCampaignById(id);
        if (!campaign || campaign.projectId !== projectId) {
            return null;
        }
        return campaign;
    }
}

export const campaignService = new CampaignService();
