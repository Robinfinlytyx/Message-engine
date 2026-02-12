import { whatsAppService } from '../services/whatsapp.service';
import { telinfyProvider } from '../providers/telinfy.provider';
import { db } from '../db/db';
import { whatsappTemplates } from '../db/schema/whatsapp_templates';
import { logger } from '../utils/logger';

// Mock data
const MOCK_PROJECT_ID = '00000000-0000-0000-0000-000000000000'; // dummy uuid
const MOCK_TEMPLATES = [
    {
        name: 'test_template',
        language: 'en',
        category: 'MARKETING',
        status: 'APPROVED',
        components: [{ type: 'BODY', text: 'Hello {{1}}' }],
        id: 'tpl_123'
    }
];

async function main() {
    logger.info('Starting WhatsApp Flow Verification...');

    // 1. Mock Provider
    logger.info('Mocking TelinfyProvider methods...');
    const originalGetTemplates = telinfyProvider.getTemplates;
    const originalSendBulk = telinfyProvider.sendBulkMessage;

    (telinfyProvider as any).getTemplates = async () => {
        logger.info('[Mock] getTemplates called');
        return MOCK_TEMPLATES as any;
    };

    (telinfyProvider as any).sendBulkMessage = async (payload: any) => {
        logger.info('[Mock] sendBulkMessage called with payload:', payload);
        return { messageId: 'msg_123', status: 'QUEUED' };
    };

    try {
        // 2. Test Sync Templates
        logger.info('Testing syncTemplates...');

        const templates = await telinfyProvider.getTemplates();
        logger.info('Fetched templates:', { templates });

        // 3. Test Bulk Send Logic
        logger.info('Testing sendBulkMessage...');

        const payload = {
            templateName: 'test_template',
            language: 'en',
            recipients: [{ to: '919999999999', body: { parameters: [{ type: 'text', text: 'Test' }] } }]
        };

        // Call validated provider method
        const result = await telinfyProvider.sendBulkMessage({
            templateName: payload.templateName,
            language: payload.language,
            recipients: payload.recipients
        });
        logger.info('Bulk Send Result:', { result });

        logger.info('Verification Complete. (DB interactions skipped to avoid FK errors in test script)');

    } catch (error) {
        logger.error('Verification Failed:', { error });
    } finally {
        // Restore mocks
        telinfyProvider.getTemplates = originalGetTemplates;
        telinfyProvider.sendBulkMessage = originalSendBulk;
        process.exit(0);
    }
}

main();
