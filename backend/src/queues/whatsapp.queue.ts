import { Queue } from 'bullmq';
import { config } from '../config';

export interface WhatsAppJobData {
    messageId: string;
}

export const whatsappQueue = new Queue<WhatsAppJobData>('whatsapp-message-queue', {
    connection: {
        host: config.redis.host,
        port: config.redis.port,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
    },
});
