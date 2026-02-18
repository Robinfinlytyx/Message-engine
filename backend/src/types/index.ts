// ============================================================================
// BASE TYPES - Channel Agnostic
// ============================================================================

// Communication channels
export type Channel = 'whatsapp' | 'email' | 'sms' | 'push';

// Message status (unified across all channels)
export enum MessageStatus {
    QUEUED = 'QUEUED',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED',
}

// Base message request (all channels)
export interface BaseMessageRequest {
    channel: Channel;
    to: string;  // Phone number, email address, device token, etc.
    [key: string]: unknown;
}

// Base provider response
export interface BaseProviderResponse {
    messageId: string;
    providerMessageId: string;
    status: MessageStatus;
}

// ============================================================================
// WHATSAPP TYPES
// ============================================================================

// Send template message request
export interface SendWhatsAppTemplateRequest extends BaseMessageRequest {
    channel: 'whatsapp';
    to: string;
    templateName: string;
    language: string;
    header?: TemplateHeader | null;
    body?: TemplateBody | null;
    button?: TemplateButton[] | null;
}

// Template header with parameters
export interface TemplateHeader {
    parameters: HeaderParameter[];
}

// Header parameter types
export type HeaderParameter =
    | { type: 'image'; image: { link: string } }
    | { type: 'video'; video: { link: string } }
    | { type: 'audio'; audio: { link: string } }
    | { type: 'document'; document: { link: string; filename?: string } };

// Template body with parameters
export interface TemplateBody {
    parameters: BodyParameter[];
}

// Body parameter (text only)
export interface BodyParameter {
    type: 'text';
    text: string;
}

// Template button
export interface TemplateButton {
    sub_type: 'url' | 'quick_reply';
    index: number;
    parameters: ButtonParameter[];
}

// Button parameter
export interface ButtonParameter {
    type: 'text';
    text: string;
}

// Telinfy API response for template message
export interface TelinfyTemplateResponse {
    data: {
        messageId: string;
        whatsAppBusinessId: string;
        from: string;
        to: string;
        source: string;
        campaignId: string | null;
        status: string;
        statusCode: string | null;
        wamId: string;
        response: unknown | null;
        isBilled: boolean;
        createTime: string;
        updateTime: string;
    };
    message: string;
}

export interface WhatsAppTemplate {
    name: string;
    language: string;
    category: string;
    components: any[];
    status: string;
    id?: string;
}

// Telinfy webhook payload
export interface TelinfyWebhookPayload {
    whatsappBusinessId: string;
    messages?: TelinfyWebhookMessage[];
    statuses?: TelinfyWebhookStatus[];
    errors?: TelinfyWebhookError[];
}

// Webhook message object
export interface TelinfyWebhookMessage {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { link: string; caption?: string };
    video?: { link: string; caption?: string };
    audio?: { link: string };
    document?: { link: string; filename?: string; caption?: string };
    location?: { latitude: number; longitude: number; address?: string; name?: string };
    contacts?: Array<{
        wa_id: string;
        profile?: { name: string };
    }>;
    context?: {
        from?: string;
        id?: string;
    };
    interactive?: {
        type: string;
        list_reply?: { id: string; title: string; description?: string };
        button_reply?: { id: string; title: string };
    };
    button?: { text: string };
}

// Webhook status object
export interface TelinfyWebhookStatus {
    id: string;
    recipient_id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted' | 'warning';
    timestamp: string;
    type: string;
    conversation?: {
        id: string;
        origin?: { type: string };
        expiration_timestamp?: number;
    };
    pricing?: {
        pricing_model: string;
        billable: boolean;
        category: string;
    };
    errors?: TelinfyWebhookError[];
}

// Webhook error object
export interface TelinfyWebhookError {
    code: number;
    title: string;
    details?: string;
    href?: string;
}

// ============================================================================
// EMAIL TYPES (Future)
// ============================================================================

export interface SendEmailRequest extends BaseMessageRequest {
    channel: 'email';
    to: string;  // Email address
    from?: string;
    subject?: string;
    templateName?: string;
    templateId?: string;
    templateVariables?: Record<string, unknown>;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
}

export interface EmailAttachment {
    filename: string;
    content: string;  // Base64 encoded
    type: string;     // MIME type
}

// ============================================================================
// SMS TYPES (Future)
// ============================================================================

export interface SendSMSRequest extends BaseMessageRequest {
    channel: 'sms';
    to: string;       // Phone number
    message: string;
    from?: string;    // Sender ID
}

// ============================================================================
// UNIFIED API TYPES
// ============================================================================

// Unified send message request (supports all channels)
export type SendMessageRequest =
    | SendWhatsAppTemplateRequest
    | SendEmailRequest
    | SendSMSRequest;

// Unified response
export interface SendMessageResponse {
    messageId: string;
    channel: Channel;
    status: MessageStatus;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

// Message model (database)
export interface Message {
    id: string;
    channel: Channel;
    provider: string;
    to: string;
    templateName: string | null;
    language: string | null;
    payload: Record<string, unknown>;
    providerMessageId: string | null;
    status: MessageStatus;
    error: Record<string, unknown> | null;
    channelSpecificData: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}

// Webhook event model (database)
export interface WebhookEvent {
    id: string;
    channel: Channel;
    provider: string;
    eventType: string;
    payload: Record<string, unknown>;
    receivedAt: Date;
}

// ============================================================================
// PROJECT TYPES (Multi-Project Support)
// ============================================================================

export interface Project {
    id: string;
    name: string;
    description: string | null;
    apiKey: string;
    status: 'active' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectContext {
    id: string;
    name: string;
    status: string;
}

export interface ProjectMessageStats {
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
}

// ============================================================================
// LEGACY TYPES (Backward Compatibility)
// ============================================================================

// Alias for backward compatibility
export type SendTemplateRequest = SendWhatsAppTemplateRequest;
export type SendTemplateResponse = SendMessageResponse;

