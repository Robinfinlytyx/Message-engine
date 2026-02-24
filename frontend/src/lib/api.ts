// API client for Communication Engine Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Project {
    id: string;
    name: string;
    description?: string;
    apiKey?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    projectId: string;
    channel: string; // 'whatsapp' | 'email' etc.
    to: string;
    templateName?: string;
    status: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
}

export interface Campaign {
    id: string;
    projectId: string;
    name: string;
    status: string;
    messageCount: number;
    scheduleTime?: string;
    telinfyCampaignId?: string;
    createdAt: string;
    updatedAt: string;
    // UI Stats fields (optional as they may need aggregation)
    totalRecipients?: number;
    sentCount?: number;
    deliveredCount?: number;
    failedCount?: number;
}

export interface DashboardStats {
    totalProjects: number;
    totalMessages: number;
    totalCampaigns: number;
    messagesLast24h: number;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            if (!response.ok) {
                let errorMsg = 'Request failed';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    // ignore json parse error
                }
                throw new Error(errorMsg);
            }

            return response.json();
        } catch (error) {
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Projects
    async getProjects(): Promise<{ data: Project[] }> {
        return this.request('/api/admin/projects');
    }

    async createProject(name: string, description?: string): Promise<{ data: Project; message: string }> {
        return this.request('/api/admin/projects', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    }

    async getProjectApiKey(projectId: string): Promise<{ apiKey: string }> {
        return this.request(`/api/admin/projects/${projectId}/api-key`);
    }

    // Messages (admin)
    async getAdminMessages(params: { projectId?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ data: Message[]; count: number }> {
        const searchParams = new URLSearchParams();
        if (params.projectId) searchParams.append('projectId', params.projectId);
        if (params.status && params.status !== 'All') searchParams.append('status', params.status);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());

        return this.request(`/api/admin/messages?${searchParams.toString()}`);
    }

    // Deprecated/Legacy method match
    async getMessages(projectId?: string, limit = 50): Promise<{ data: Message[]; count: number }> {
        return this.getAdminMessages({ projectId, limit });
    }

    // Campaigns (admin)
    async getAdminCampaigns(params: { projectId?: string; limit?: number } = {}): Promise<{ data: Campaign[]; count: number }> {
        const searchParams = new URLSearchParams();
        if (params.projectId) searchParams.append('projectId', params.projectId);
        if (params.limit) searchParams.append('limit', params.limit.toString());

        return this.request(`/api/admin/campaigns?${searchParams.toString()}`);
    }

    // Campaigns (public) - requires API key, useful for simulating client
    async getCampaigns(apiKey: string): Promise<{ data: Campaign[]; count: number }> {
        return this.request('/api/whatsapp/campaigns', {
            headers: { 'X-API-Key': apiKey },
        });
    }

    // Templates
    async createWhatsAppTemplate(projectId: string, apiKey: string, payload: any): Promise<any> {
        return this.request('/api/whatsapp/templates', {
            method: 'POST',
            headers: { 'X-API-Key': apiKey },
            body: JSON.stringify(payload),
        });
    }

    // Dashboard stats
    async getStats(): Promise<DashboardStats> {
        return this.request('/api/admin/stats');
    }

    // Email Service (requires project API Key)
    async getProjectEmails(projectId: string, apiKey: string, params: { limit?: number; offset?: number; status?: string } = {}): Promise<{ data: EmailMessage[]; count: number }> {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        if (params.status && params.status !== 'All') searchParams.append('status', params.status);

        return this.request(`/api/email/project/${projectId}?${searchParams.toString()}`, {
            headers: { 'X-API-Key': apiKey }
        });
    }

    async getProjectBatches(projectId: string, apiKey: string, params: { limit?: number; offset?: number } = {}): Promise<{ data: EmailBatch[]; count: number }> {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());

        return this.request(`/api/email/project/${projectId}/batches?${searchParams.toString()}`, {
            headers: { 'X-API-Key': apiKey }
        });
    }
}

export const api = new ApiClient();

export interface EmailMessage {
    id: string;
    projectId: string;
    to: string;
    subject: string;
    status: string;
    batchId?: string;
    retryCount: number;
    maxRetries: number;
    error?: any;
    sentAt?: string;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailBatch {
    id: string;
    projectId: string;
    name: string;
    status: string;
    totalEmails: number;
    processedCount: number;
    successCount: number;
    failedCount: number;
    createdAt: string;
    updatedAt: string;
    progress?: number; // computed
}
