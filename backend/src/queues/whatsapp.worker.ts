import { Worker, Job } from 'bullmq';
import { config, getRedisConnectionOptions } from '../config';
import { db, schema } from '../db/db';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { eq } from 'drizzle-orm';
import { telinfyProvider } from '../providers/telinfy.provider';
import { MessageStatus } from '../types';
import type { WhatsAppJobData } from './whatsapp.queue';

export function createWhatsAppWorker(): Worker<WhatsAppJobData> {
    const worker = new Worker<WhatsAppJobData>(
        'whatsapp-message-queue',
        async (job: Job<WhatsAppJobData>) => {
            const { messageId } = job.data;

            console.log('\n┌─────────────────────────────────────────────────────');
            console.log(`│ 📤 Processing Job #${job.id}`);
            console.log(`│ Message ID: ${messageId}`);
            console.log('└─────────────────────────────────────────────────────');

            try {
                // Fetch message from new whatsappMessages table first
                console.log('  ⏳ Fetching message from database...');
                let message = await db.query.whatsappMessages.findFirst({
                    where: eq(whatsappMessages.id, messageId),
                });

                // Fallback to legacy messages table if not found
                let useLegacyTable = false;
                if (!message) {
                    console.log('  ℹ️  Not in new table, checking legacy messages...');
                    const legacyMessage = await db.query.messages.findFirst({
                        where: eq(schema.messages.id, messageId),
                    });
                    if (legacyMessage) {
                        // Use legacy message data - cast through unknown for type compatibility
                        message = legacyMessage as unknown as typeof message;
                        useLegacyTable = true;
                    }
                }

                if (!message) {
                    throw new Error(`Message not found: ${messageId}`);
                }

                console.log(`  ✓ Message found - To: ${message.to}`);
                console.log(`  ✓ Template: ${message.templateName || 'N/A'}`);

                // Call Telinfy API
                console.log('  🚀 Sending to Telinfy API...');
                const response = await telinfyProvider.sendTemplateMessage(
                    message.payload as Record<string, unknown>
                );

                console.log(`  ✓ Telinfy accepted - WAM ID: ${response.wamId}`);

                // Update message with provider response
                if (useLegacyTable) {
                    await db
                        .update(schema.messages)
                        .set({
                            providerMessageId: response.wamId,
                            status: MessageStatus.SENT,
                            updatedAt: new Date(),
                        })
                        .where(eq(schema.messages.id, messageId));
                } else {
                    await db
                        .update(whatsappMessages)
                        .set({
                            providerMessageId: response.wamId,
                            status: MessageStatus.SENT,
                            sentAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .where(eq(whatsappMessages.id, messageId));
                }

                console.log('  ✓ Database updated - Status: SENT');
                console.log('  ✅ SUCCESS - Message sent successfully\n');

                return { success: true, wamId: response.wamId };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                console.log('  ❌ ERROR - Failed to send message');
                console.log(`  ⚠️  Reason: ${errorMessage}`);

                // Update message status to FAILED - try new table first
                try {
                    await db
                        .update(whatsappMessages)
                        .set({
                            status: MessageStatus.FAILED,
                            error: error instanceof Error ? { message: error.message, stack: error.stack } : { error },
                            updatedAt: new Date(),
                        })
                        .where(eq(whatsappMessages.id, messageId));
                } catch {
                    // Fallback to legacy table
                    await db
                        .update(schema.messages)
                        .set({
                            status: MessageStatus.FAILED,
                            error: error instanceof Error ? { message: error.message, stack: error.stack } : { error },
                            updatedAt: new Date(),
                        })
                        .where(eq(schema.messages.id, messageId));
                }

                console.log('  ✓ Database updated - Status: FAILED\n');

                throw error;
            }
        },
        {
            connection: getRedisConnectionOptions(),
            concurrency: 5,
        }
    );

    worker.on('completed', (job) => {
        console.log(`✅ Job #${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.log(`❌ Job #${job?.id} failed: ${err.message}`);
    });

    return worker;
}
