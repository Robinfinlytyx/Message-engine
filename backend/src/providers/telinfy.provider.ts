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
    fileId: string | number;
    name?: string;
    size?: string;
    url?: string;
}

interface CreateCampaignResult {
    campaignId: number;
    accountId: string;
    channelId: string;
    channelGroupId: number;
    platformId: number;
    campaignName: string;
    template: {
        userName: string;
        phoneNumberId: string;
        businessAccountId: string;
        templateName: string;
        language: string;
        header: any;
        body: any;
        currency: string;
        category: string;
    };
    fileId: number;
    status: number;
    scheduleTime: string;
    remarks: any;
    createdAt: string;
    updatedAt: string;
}

/**
 * Configuration needed to construct a TelinfyProvider instance.
 */
export interface TelinfyProviderConfig {
    apiKey: string;
    baseUrl: string;
    fileUrl: string;
    whatsAppBusinessId: string;
    accessId?: string | null;
    phoneNumberId?: string | null;
    userName?: string | null;
    businessAccountId?: string | null;
}

export class TelinfyProvider {
    private readonly baseUrl: string;
    private readonly fileUploadUrl: string;
    private readonly campaignUrl: string;
    private readonly apiKey: string;
    private readonly whatsAppBusinessId: string;
    private readonly accessId: string | null;
    private readonly phoneNumberId: string | null;
    private readonly userName: string | null;
    private readonly businessAccountId: string | null;

    constructor(providerConfig: TelinfyProviderConfig) {
        this.baseUrl = providerConfig.baseUrl;
        this.fileUploadUrl = `https://api.prod.telinfy.net/gatc/file/upload`;
        this.campaignUrl = `https://api.prod.telinfy.net/gatc/campaign`;
        this.apiKey = providerConfig.apiKey;
        this.whatsAppBusinessId = providerConfig.whatsAppBusinessId;
        this.accessId = providerConfig.accessId || null;
        this.phoneNumberId = providerConfig.phoneNumberId || null;
        this.userName = providerConfig.userName || null;
        this.businessAccountId = providerConfig.businessAccountId || null;
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
            // Generate CSV content
            const csvRows = ['country_code,mobile_number'];
            for (const msg of messages) {
                const toField = String(msg.to || '').trim();
                let countryCode = '91'; // Telinfy usually expects without + if it's country_code, but let's see. The screenshot shows CountryCode might just be 91 or +91. Let's use 91 as default.
                let mobileNumber = toField;

                // Simple parser to extract 91 or other common codes
                if (toField.startsWith('+')) {
                    // Assuming e.g. +919999999999
                    countryCode = toField.substring(1, 3);
                    mobileNumber = toField.substring(3);
                } else if (toField.length > 10 && toField.startsWith('91')) {
                    countryCode = '91';
                    mobileNumber = toField.substring(2);
                } else if (toField.length === 10) {
                    countryCode = '91';
                    mobileNumber = toField;
                }

                csvRows.push(`${countryCode},${mobileNumber}`);
            }

            const csvContent = csvRows.join('\n');

            // Create form data using Axios 1.x native FormData/Blob support
            const formData = new FormData();
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            formData.append('file', csvBlob, `campaign-${Date.now()}.csv`);

            const response = await axios.post<{
                data: FileUploadResult;
                message: string;
            }>(url, formData, {
                headers: {
                    'API-Key': this.apiKey,
                },
                timeout: 60000,
            });

            logger.info('Campaign file uploaded successfully', {
                fileId: response.data.data.fileId,
                fileName: response.data.data.name,
            });

            const responseData = response.data.data;
            return {
                ...responseData,
                fileId: String(responseData.fileId)
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorData = error.response?.data;
                const errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData);
                logger.error('Telinfy file upload error', {
                    status: error.response?.status,
                    data: errorData,
                    message: errorMessage
                });
                throw new Error(
                    `Telinfy file upload error: ${error.response?.status} - ${errorMessage}`
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
        campaignName: string;
        channelGroupId: number;
        platformId: number;
        templateName: string;
        language: string;
        header: any;
        body: any;
        fileId: number;
        scheduleTime: string;
    }): Promise<CreateCampaignResult> {
        logger.info('Creating campaign on Telinfy', {
            campaignName: payload.campaignName,
            fileId: payload.fileId,
            payload: payload
        });

        // Use the db credentials mapped to the provider for API authentication
        const apiPayload = {
            channelId: this.whatsAppBusinessId, // from DB telinfyWhatsappBusinessId
            accountId: this.apiKey, // from DB telinfyApiKey
            channelGroupId: payload.channelGroupId,
            platformId: payload.platformId,
            campaignName: payload.campaignName,
            template: {
                userName: this.userName || '', // from DB telinfyUserName
                phoneNumberId: this.phoneNumberId || '', // from DB telinfyPhoneNumberId
                businessAccountId: this.businessAccountId || '', // from DB telinfyBusinessAccountId
                apiKey: this.accessId || '', // from DB telinfyAccessId
                templateName: payload.templateName,
                language: payload.language,
                header: payload.header,
                body: payload.body,
            },
            fileId: payload.fileId,
            scheduleTime: payload.scheduleTime
        };
        console.log('apiPayload', apiPayload);
        try {
            const response = await axios.post<{
                data: CreateCampaignResult;
                message: string;
            }>(this.campaignUrl, apiPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': this.apiKey, // Assuming this is needed in the header too, though it's inside template object
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
                const errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData);
                logger.error('Telinfy campaign creation error', {
                    status: error.response?.status,
                    data: errorData,
                    message: errorMessage
                });
                throw new Error(
                    `Telinfy campaign creation error: ${error.response?.status} - ${errorMessage}`
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

