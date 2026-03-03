import { config, validateConfig } from './config';
import app from './app';
import { createWhatsAppWorker } from './queues/whatsapp.worker';
import { emailWorker } from './queues/email.worker';
import { logger } from './utils/logger';
import { Worker } from 'bullmq';

async function main(): Promise<void> {
    try {
        // Validate configuration
        validateConfig();
        logger.info('Configuration validated successfully');

        // ── Start the Express server ──
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info(`Server started on port ${config.port} (0.0.0.0)`);
            logger.info(`  GET  /health`);
        });

        // ── Optionally start workers in the same process ──
        // Set START_WORKERS=true (or use `npm run start:all`) to run everything in one process.
        // In dev you can still run them separately with `npm run dev:worker`.
        const startWorkers = process.env.START_WORKERS === 'true';
        const workers: Worker[] = [];

        if (startWorkers) {
            const whatsappWorker = createWhatsAppWorker();
            workers.push(whatsappWorker);
            workers.push(emailWorker);

            console.log('\n╔════════════════════════════════════════════════════╗');
            console.log('║   Communication Engine — Server + Workers          ║');
            console.log('╚════════════════════════════════════════════════════╝\n');

            logger.info('✓ WhatsApp worker listening (queue: whatsapp-message-queue)');
            logger.info('✓ Email worker listening (queue: email)');
            logger.info('Workers started in same process as server');
        } else {
            logger.info('Workers NOT started (set START_WORKERS=true to embed workers)');
        }

        // ── Graceful shutdown ──
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            // Close workers first (stop accepting new jobs)
            if (workers.length > 0) {
                await Promise.all(workers.map(w => w.close()));
                logger.info('✓ All workers closed');
            }

            server.close(() => {
                logger.info('HTTP server closed');
            });

            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
    }
}

main();
