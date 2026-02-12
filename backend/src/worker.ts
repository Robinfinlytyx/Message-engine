import { validateConfig } from './config';
import { createWhatsAppWorker } from './queues/whatsapp.worker';
import { emailWorker } from './queues/email.worker';
import { logger } from './utils/logger';

async function main(): Promise<void> {
    try {
        // Validate configuration
        validateConfig();

        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║     Communication Engine Workers - STARTED         ║');
        console.log('╚════════════════════════════════════════════════════╝\n');

        logger.info('✓ Configuration validated');

        // Start the WhatsApp worker
        const whatsappWorker = createWhatsAppWorker();
        logger.info('✓ WhatsApp worker connected to Redis and listening for jobs');

        // Email worker is already started on import
        logger.info('✓ Email worker connected to Redis and listening for jobs');

        console.log('\n📊 Worker Status:');
        console.log('   📱 WhatsApp:');
        console.log('      - Queue: whatsapp-message-queue');
        console.log('      - Concurrency: 5 jobs at a time');
        console.log('      - Retry: 3 attempts with exponential backoff');
        console.log('   📧 Email:');
        console.log('      - Queue: email');
        console.log('      - Concurrency: 5 jobs at a time');
        console.log('      - Retry: 3 attempts with exponential backoff');
        console.log('   - Waiting for jobs...\n');

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n\n🛑 Received ${signal}, shutting down workers gracefully...`);

            await Promise.all([
                whatsappWorker.close(),
                emailWorker.close(),
            ]);
            logger.info('✓ All workers closed');

            console.log('👋 Workers stopped successfully\n');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('\n❌ Failed to start workers:');
        console.error('   ', error instanceof Error ? error.message : 'Unknown error');
        console.error('\n');
        process.exit(1);
    }
}

main();
