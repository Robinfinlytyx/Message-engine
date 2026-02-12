import { db, schema } from '../db/db';
import { logger } from '../utils/logger';
import { Channel } from '../types';

class WebhookService {
    /**
     * Store raw webhook event in database
     */
    async storeWebhookEvent(
        channel: Channel,
        provider: string,
        eventType: string,
        payload: Record<string, unknown>
    ): Promise<void> {
        logger.info('Storing webhook event', { channel, provider, eventType });

        await db.insert(schema.webhookEvents).values({
            channel,
            provider,
            eventType,
            payload,
            receivedAt: new Date(),
        });
    }
}

export const webhookService = new WebhookService();
