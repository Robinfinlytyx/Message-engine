import { db } from '../db/db';
import { campaigns, CampaignInsert } from '../db/schema/campaigns';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { providerFactory } from '../providers/provider.factory';
import { logger } from '../utils/logger';

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
    /**
     * Create a new campaign using the project's own Telinfy credentials.
     * 1. Resolve the project's Telinfy provider (gets channelId from project config)
     * 2. Store campaign in database
     * 3. Upload messages file to Telinfy
     * 4. Create campaign on Telinfy
     * 5. Update campaign with Telinfy response
     */
    async createCampaign(
        projectId: string,
        request: CreateCampaignRequest
    ): Promise<CreateCampaignResponse> {
        const { name, messages, scheduleTime, channelGroupId = 1 } = request;

        logger.info('Creating campaign', {
            projectId,
            name,
            messageCount: messages.length,
        });

        // Validate
        if (!messages || messages.length === 0) {
            throw new Error('Campaign must have at least one message');
        }

        // Resolve the project's Telinfy provider and get channelId
        const telinfyProvider = await providerFactory.getTelinfyProvider(projectId);
        const channelId = telinfyProvider.getWhatsAppBusinessId();

        if (!channelId) {
            throw new Error('WhatsApp Business ID not configured for this project');
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
            channelId,
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
                channelId
            );

            // Update campaign with file ID
            await db.update(campaigns)
                .set({
                    fileId: String(fileUploadResult.fileId),
                    updatedAt: new Date(),
                })
                .where(eq(campaigns.id, campaign.id));

            // Step 3: Create campaign on Telinfy
            // Telinfy's Python backend crashes on offset-aware datetimes (like ending in Z or +05:30)
            // It strictly requires offset-naive strings like "2026-03-10T10:00:00.000"
            const rawScheduleTime = scheduleTime || new Date().toISOString();

            // Convert any ISO string to offset-naive format: YYYY-MM-DDTHH:mm:ss.000
            const dateObj = new Date(rawScheduleTime);
            let campaignScheduleTime = dateObj.toISOString().split('Z')[0];

            // toISOString() usually outputs YYYY-MM-DDTHH:mm:ss.SSSZ
            // So splitting by 'Z' already includes the .SSS (milliseconds).
            // We only need to append .000 if it strictly lacks milliseconds.
            if (!campaignScheduleTime.includes('.')) {
                campaignScheduleTime += '.000';
            }

            // The template mapping is unified for the whole campaign, we assume messages[0] holds it
            const firstMessage = messages[0];

            const telinfyResult = await telinfyProvider.createCampaign({
                campaignName: name,
                channelGroupId: channelGroupId, // Usually 1 for WhatsApp or as configured
                platformId: 1, // Usually 1 for WhatsApp Platform on Telinfy
                templateName: firstMessage.templateName,
                language: firstMessage.language,
                header: firstMessage.header || null,
                body: firstMessage.body || null,
                fileId: Number(fileUploadResult.fileId),
                scheduleTime: campaignScheduleTime,
            });

            // Map Telinfy numeric status to a string representation if needed, or just store the number as string
            const telinfyStatusStr = String(telinfyResult.status);

            // Step 4: Update campaign with Telinfy response
            await db.update(campaigns)
                .set({
                    telinfyCampaignId: String(telinfyResult.campaignId),
                    status: telinfyStatusStr,
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
                status: telinfyStatusStr,
                messageCount: messages.length,
                scheduleTime: campaignScheduleTime,
                telinfyCampaignId: String(telinfyResult.campaignId),
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
    async getCampaignsByProject(projectId: string, limit: number = 50, offset: number = 0) {
        const data = await db.select()
            .from(campaigns)
            .where(eq(campaigns.projectId, projectId))
            .orderBy(desc(campaigns.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(campaigns)
            .where(eq(campaigns.projectId, projectId));

        return {
            data,
            count: Number(countResult?.count || 0)
        };
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
    async getAllCampaigns(params: { projectId?: string; projectIds?: string[]; limit?: number; offset?: number }) {
        const { projectId, projectIds, limit = 50, offset = 0 } = params;

        let whereClause;
        if (projectId) {
            whereClause = eq(campaigns.projectId, projectId);
        } else if (projectIds && projectIds.length > 0) {
            whereClause = inArray(campaigns.projectId, projectIds);
        }

        const dataQuery = db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(limit).offset(offset);
        const countQuery = db.select({ count: sql<number>`count(*)` }).from(campaigns);

        if (whereClause) {
            dataQuery.where(whereClause);
            countQuery.where(whereClause);
        }

        const [data, [countResult]] = await Promise.all([
            dataQuery,
            countQuery
        ]);

        return {
            data,
            count: Number(countResult?.count || 0)
        };
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

