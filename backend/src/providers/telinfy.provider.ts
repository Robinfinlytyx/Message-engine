import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { TelinfyTemplateResponse } from '../types';

interface SendTemplateResult {
    messageId: string;
    wamId: string;
    status: string;
}

interface FileUploadResult {
    fileId: string;
    name: string;
    size: string;
    url: string;
}

interface CreateCampaignResult {
    campaignId: string;
    whatsAppBusinessId: string;
    campaignName: string;
    scheduleTime: string;
    status: string;
    from: string;
}

/**
 * Configuration needed to construct a TelinfyProvider instance.
 */
export interface TelinfyProviderConfig {
    apiKey: string;
    baseUrl: string;
    fileUrl: string;
    whatsAppBusinessId: string;
}

export class TelinfyProvider {
    private readonly baseUrl: string;
    private readonly fileUploadUrl: string;
    private readonly campaignUrl: string;
    private readonly apiKey: string;
    private readonly whatsAppBusinessId: string;

    constructor(providerConfig: TelinfyProviderConfig) {
        this.baseUrl = providerConfig.baseUrl;
        this.fileUploadUrl = `${providerConfig.fileUrl}/adapter/files/upload`;
        this.campaignUrl = `${this.baseUrl}/telinfy-gcms/v4/whatsapp/campaign`;
        this.apiKey = providerConfig.apiKey;
        this.whatsAppBusinessId = providerConfig.whatsAppBusinessId;
    }

    /**
     * Get the WhatsApp Business ID this provider is configured for.
     */
    getWhatsAppBusinessId(): string {
        return this.whatsAppBusinessId;
    }

    /**
     * Send a template message via Telinfy API
     * Supports: text-only, variables, image, video, audio, PDF, URL buttons
     */
    async sendTemplateMessage(payload: Record<string, unknown>): Promise<SendTemplateResult> {
        const url = `${this.baseUrl}/gaca/whatsapp/templates/message`;

        logger.info('Sending template message to Telinfy', {
            to: payload.to,
            templateName: payload.templateName,
        });

        try {
            const response = await axios.post<TelinfyTemplateResponse>(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey,
                },
                timeout: 30000,
            });

            logger.info('Telinfy API response', {
                messageId: response.data.data.messageId,
                wamId: response.data.data.wamId,
                status: response.data.data.status,
            });

            return {
                messageId: response.data.data.messageId,
                wamId: response.data.data.wamId,
                status: response.data.data.status,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorData = error.response?.data;
                logger.error('Telinfy API error', {
                    status: error.response?.status,
                    data: errorData,
                });
                throw new Error(
                    `Telinfy API error: ${error.response?.status} - ${JSON.stringify(errorData)}`
                );
            }
            throw error;
        }
    }

    /**
     * Upload campaign file (JSON with message payloads) to Telinfy
     * This is Step 1 of the Campaign API
     */
    async uploadCampaignFile(
        messages: Array<Record<string, unknown>>,
        whatsAppBusinessId: string
    ): Promise<FileUploadResult> {
        const url = `${this.fileUploadUrl}?whatsAppBusinessId=${whatsAppBusinessId}`;

        logger.info('Uploading campaign file to Telinfy', {
            messageCount: messages.length,
            whatsAppBusinessId,
        });

        try {
            // Create JSON file content
            const jsonContent = JSON.stringify(messages);
            const blob = Buffer.from(jsonContent, 'utf-8');

            // Create form data (Note: Key must be 'file' based on documentation)
            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            formData.append('file', blob, {
                filename: `campaign-${Date.now()}.json`,
                contentType: 'application/json',
            });

            const response = await axios.post<{
                data: FileUploadResult;
                message: string;
            }>(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'API-Key': this.apiKey,
                    'api-key': this.apiKey,
                    'Header-Api-Key': this.apiKey,
                },
                timeout: 60000,
            });

            logger.info('Campaign file uploaded successfully', {
                fileId: response.data.data.fileId,
                fileName: response.data.data.name,
            });

            return response.data.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorData = error.response?.data;
                logger.error('Telinfy file upload error', {
                    status: error.response?.status,
                    data: errorData,
                });
                throw new Error(
                    `Telinfy file upload error: ${error.response?.status} - ${JSON.stringify(errorData)}`
                );
            }
            throw error;
        }
    }

    /**
     * Create a campaign on Telinfy
     * This is Step 2 of the Campaign API
     */
    async createCampaign(payload: {
        channelId: string;
        campaignId: string; // This is the fileId from file upload
        campaignName: string;
        channelGroupId: number;
        scheduleTime: string;
        campaignMessageCount: number;
    }): Promise<CreateCampaignResult> {
        logger.info('Creating campaign on Telinfy', {
            campaignName: payload.campaignName,
            messageCount: payload.campaignMessageCount,
        });

        try {
            const response = await axios.post<{
                data: CreateCampaignResult;
                message: string;
            }>(this.campaignUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey,
                },
                timeout: 30000,
            });

            logger.info('Campaign created successfully', {
                campaignId: response.data.data.campaignId,
                status: response.data.data.status,
            });

            return response.data.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorData = error.response?.data;
                logger.error('Telinfy campaign creation error', {
                    status: error.response?.status,
                    data: errorData,
                });
                throw new Error(
                    `Telinfy campaign creation error: ${error.response?.status} - ${JSON.stringify(errorData)}`
                );
            }
            throw error;
        }
    }
    /**
     * Get all templates from Telinfy
     */
    async getTemplates(): Promise<import('../types').WhatsAppTemplate[]> {
        const url = `${this.baseUrl}/gaca/whatsapp/templates?whatsAppBusinessId=${this.whatsAppBusinessId}`;
        try {
            const response = await axios.get<any>(url, {
                headers: { 'API-Key': this.apiKey },
            });

            return response.data.data.waba_templates || [];
        } catch (error) {
            this.handleError(error, 'getTemplates');
            throw error;
        }
    }

    /**
     * Create a new template
     */
    async createTemplate(payload: Record<string, unknown>): Promise<any> {
        const url = `${this.baseUrl}/gaca/template/create`;
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey
                },
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'createTemplate');
            throw error;
        }
    }

    /**
     * Send bulk message via Notify endpoint
     */
    async sendBulkMessage(payload: Record<string, unknown>): Promise<any> {
        const url = `${this.baseUrl}/gaca/whatsapp/templates/notify`;
        logger.info(`Sending bulk message to URL: ${url}`);
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey
                },
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'sendBulkMessage');
            throw error;
        }
    }

    private handleError(error: unknown, context: string): void {
        if (error instanceof AxiosError) {
            const errorData = error.response?.data;
            logger.error(`Telinfy ${context} error`, {
                status: error.response?.status,
                data: errorData,
            });
            throw new Error(
                `Telinfy ${context} error: ${error.response?.status} - ${JSON.stringify(errorData)}`
            );
        }
        logger.error(`Telinfy ${context} unexpected error`, { error });
    }
}

/**
 * Default singleton using .env configuration (backward compatibility).
 * Services should migrate to using ProviderFactory instead.
 */
export const telinfyProvider = new TelinfyProvider({
    apiKey: config.telinfy.apiKey,
    baseUrl: config.telinfy.baseUrl,
    fileUrl: config.telinfy.fileUrl,
    whatsAppBusinessId: config.telinfy.whatsAppBusinessId,
});

