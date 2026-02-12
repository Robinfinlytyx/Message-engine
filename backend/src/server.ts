import { config, validateConfig } from './config';
import app from './app';
import { createWhatsAppWorker } from './queues/whatsapp.worker';
import { logger } from './utils/logger';

async function main(): Promise<void> {
    try {
        // Validate configuration
        validateConfig();
        logger.info('Configuration validated successfully');

        // Start the Express server
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info(`Server started on port ${config.port} (0.0.0.0)`);
            logger.info(`  GET  /health`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

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
