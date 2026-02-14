import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),

    database: {
        url: process.env.DATABASE_URL || '',
    },

    redis: {
        url: process.env.REDIS_URL || process.env.REDIS_URL_PUBLIC || '',
        host: process.env.REDISHOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDISPORT || process.env.REDIS_PORT || '6379', 10),
        user: process.env.REDISUSER || process.env.REDIS_USER || '',
        password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || '',
    },

    telinfy: {
        apiKey: process.env.TELINFY_API_KEY || '',
        baseUrl: 'https://api.telinfy.net',
        whatsAppBusinessId: process.env.TELINFY_WHATSAPP_BUSINESS_ID || '',
    },
};

/**
 * Get Redis connection options for BullMQ
 */
export const getRedisConnectionOptions = () => {
    if (config.redis.url) {
        return {
            url: config.redis.url,
            family: 0,
        };
    }

    return {
        host: config.redis.host,
        port: config.redis.port,
        username: config.redis.user || undefined,
        password: config.redis.password || undefined,
        family: 0,
    };
};

// Validate required configuration
export function validateConfig(): void {
    const required = ['DATABASE_URL', 'TELINFY_API_KEY', 'TELINFY_WHATSAPP_BUSINESS_ID'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
