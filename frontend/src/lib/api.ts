import axios from 'axios';

// Utility to get cookie by name
function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Message {
    id: string;
    projectId?: string;
    to: string;
    channel: string;
    templateName?: string;
    status: string;
    createdAt: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    apiKey: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Campaign {
    id: string;
    projectId?: string;
    name: string;
    description?: string;
    status: string;
    scheduleTime?: string;
    totalRecipients?: number;
    sentCount?: number;
    deliveredCount?: number;
    failedCount?: number;
    messageCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmailMessage {
    id: string;
    batchId?: string;
    to: string;
    subject: string;
    status: string;
    createdAt: string;
}

export interface EmailBatch {
    id: string;
    name: string;
    status: string;
    totalEmails: number;
    processedCount: number;
    failedCount: number;
    createdAt: string;
}

export interface ProjectConfig {
    id: string;
    projectId: string;
    whatsappEnabled: boolean;
    telinfyApiKey?: string;
    telinfyWhatsappBusinessId?: string;
    telinfyAccessId?: string;
    telinfyPhoneNumberId?: string;
    telinfyUserName?: string;
    telinfyBusinessAccountId?: string;
    emailEnabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    defaultFromEmail?: string;
    defaultFromName?: string;
}

export interface ProjectConfigInput {
    whatsapp?: {
        enabled: boolean;
        telinfyApiKey?: string;
        telinfyWhatsappBusinessId?: string;
        telinfyAccessId?: string;
        telinfyPhoneNumberId?: string;
        telinfyUserName?: string;
        telinfyBusinessAccountId?: string;
    };
    email?: {
        enabled: boolean;
        smtpHost?: string;
        smtpPort?: number;
        smtpSecure?: boolean;
        smtpUser?: string;
        smtpPassword?: string;
        defaultFromEmail?: string;
        defaultFromName?: string;
    };
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token from cookies
apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const cookies = document.cookie.split('; ').reduce((prev: any, current) => {
            const [name, ...value] = current.split('=');
            prev[name] = value.join('=');
            return prev;
        }, {});
        
        const token = cookies['auth_token'];
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Optional: Add response interceptor for refresh token logic later
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
            // Future: Implement refresh token logic here
        }
        return Promise.reject(error);
    }
);

// Define API methods
export const api = {
    auth: {
        login: (data: any) => apiClient.post('/api/auth/login', data),
        signup: (data: any) => apiClient.post('/api/auth/signup', data),
        me: () => apiClient.get('/api/auth/me'),
        superAdminLogin: (data: any) => apiClient.post('/api/superadmin/login', data),
    },
    org: {
        getTeam: () => apiClient.get('/api/org/team'),
        inviteMember: (data: any) => apiClient.post('/api/org/team/invite', data),
        removeMember: (userId: string) => apiClient.delete(`/api/org/team/members/${userId}`),
        updateMemberRole: (userId: string, data: any) => apiClient.put(`/api/org/team/members/${userId}/role`, data),
    },
    projects: {
        list: () => apiClient.get('/api/admin/projects'),
        create: (data: any) => apiClient.post('/api/admin/projects', data),
        get: (id: string) => apiClient.get(`/api/admin/projects/${id}`),
        getApiKey: (id: string) => apiClient.get(`/api/admin/projects/${id}/api-key`),
        updateStatus: (id: string, status: string) => apiClient.patch(`/api/admin/projects/${id}/status`, { status }),
    },
    // Adding missing project-level endpoints that expect API key
    getProjectEmails: (projectId: string, apiKey: string, params: any) => 
        apiClient.get(`/api/admin/projects/${projectId}/emails`, { 
            params,
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    getProjectBatches: (projectId: string, apiKey: string, params: any) => 
        apiClient.get(`/api/admin/projects/${projectId}/batches`, { 
            params,
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    createWhatsAppTemplate: (projectId: string, apiKey: string, data: any) => 
        apiClient.post(`/api/whatsapp/templates`, data, {
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    getWhatsAppTemplates: (projectId: string, apiKey: string, params?: any) => 
        apiClient.get(`/api/whatsapp/templates`, {
            params,
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    syncWhatsAppTemplates: (projectId: string, apiKey: string) => 
        apiClient.post(`/api/whatsapp/templates/sync`, {}, {
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    sendWhatsAppTemplate: (projectId: string, apiKey: string, data: any) => 
        apiClient.post(`/api/whatsapp/send-template`, data, {
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
    createWhatsAppCampaign: (projectId: string, apiKey: string, data: any) => 
        apiClient.post(`/api/whatsapp/campaign`, data, {
            headers: { 'X-API-Key': apiKey }
        }).then(res => res.data),
        
    admin: {
        getStats: () => apiClient.get('/api/admin/stats'),
        getMessages: (params: any) => apiClient.get('/api/admin/messages', { params }),
        getCampaigns: (params: any) => apiClient.get('/api/admin/campaigns', { params }),
    },
    superadmin: {
        getStats: () => apiClient.get('/api/superadmin/stats'),
        getOrgs: () => apiClient.get('/api/superadmin/organizations'),
    },
    
    // Project Configuration endpoints
    getProjectConfig: (id: string) => apiClient.get(`/api/admin/projects/${id}/config`).then(res => res.data),
    upsertProjectConfig: (id: string, data: ProjectConfigInput) => apiClient.put(`/api/admin/projects/${id}/config`, data).then(res => res.data),
    deleteProjectConfig: (id: string) => apiClient.delete(`/api/admin/projects/${id}/config`).then(res => res.data),
    testWhatsAppConfig: (id: string) => apiClient.post(`/api/admin/projects/${id}/config/test-whatsapp`).then((res) => res.data),
    testEmailConfig: (id: string) => apiClient.post(`/api/admin/projects/${id}/config/test-email`).then((res) => res.data),

    // Aliases for backward compatibility or different naming conventions
    getAdminCampaigns: (params?: any) => apiClient.get('/api/admin/campaigns', { params }),
};
