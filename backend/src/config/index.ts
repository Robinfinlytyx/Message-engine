import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),

    database: {
        url: process.env.DATABASE_URL || '',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },

    telinfy: {
        apiKey: process.env.TELINFY_API_KEY || '',
        baseUrl: 'https://api.telinfy.net',
        whatsAppBusinessId: process.env.TELINFY_WHATSAPP_BUSINESS_ID || '',
    },
};

// Validate required configuration
export function validateConfig(): void {
    const required = ['DATABASE_URL', 'TELINFY_API_KEY', 'TELINFY_WHATSAPP_BUSINESS_ID'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
