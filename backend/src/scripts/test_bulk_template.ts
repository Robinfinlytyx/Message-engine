import { db } from '../db/db';
import { emailService } from '../services/email.service';
import { emailTemplates } from '../db/schema/email_templates';
import { projects } from '../db/schema/projects';

async function testBulkEmailTemplates() {
    console.log('Starting Bulk Email Templating Test...');

    try {
        // 1. Get a project ID
        let project = await db.query.projects.findFirst();
        if (!project) {
            console.error('No project found. Run the previous test first.');
            process.exit(1);
        }
        console.log('Using project:', project.id);

        // 2. Create a template
        console.log('Creating template...');
        const templateData = {
            name: 'Bulk Template ' + Date.now(),
            subject: 'Bulk Hello, {{name}}!',
            htmlContent: '<h1>Hi {{name}}</h1><p>From {{city}}.</p>',
            textContent: 'Hi {{name}}, From {{city}}.',
            variables: ['name', 'city'],
        };
        const template = await emailService.createTemplate(project.id, templateData);
        console.log('Template created:', template.id);

        // 3. Send bulk emails
        console.log('Sending bulk emails...');
        const bulkRequest = {
            batchName: 'Test Bulk Batch ' + Date.now(),
            emails: [
                {
                    to: 'user1@example.com',
                    templateId: template.id,
                    templateVariables: { name: 'User One', city: 'New York' },
                },
                {
                    to: 'user2@example.com',
                    templateId: template.id,
                    templateVariables: { name: 'User Two', city: 'London' },
                },
            ],
        } as any;

        const result = await emailService.sendBulkEmails(bulkRequest, project.id);
        console.log('Bulk batch created:', result.batchId);

        // 4. Verify in DB
        console.log('Verifying emails in DB...');
        const messages = await emailService.getEmailsByProject(project.id, 10, 0);

        // Find emails from this batch
        const batchEmails = messages.data.filter(m => m.batchId === result.batchId);
        console.log(`Found ${batchEmails.length} emails in batch.`);

        for (const msg of batchEmails) {
            console.log(`To: ${msg.to}, Subject: ${msg.subject}`);
            console.log(`HTML: ${msg.htmlContent}`);

            if (msg.to === 'user1@example.com') {
                if (msg.subject === 'Bulk Hello, User One!' && msg.htmlContent?.includes('New York')) {
                    console.log('SUCCESS: User 1 substitution correct.');
                } else {
                    console.error('FAILURE: User 1 substitution incorrect.');
                }
            } else if (msg.to === 'user2@example.com') {
                if (msg.subject === 'Bulk Hello, User Two!' && msg.htmlContent?.includes('London')) {
                    console.log('SUCCESS: User 2 substitution correct.');
                } else {
                    console.error('FAILURE: User 2 substitution incorrect.');
                }
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testBulkEmailTemplates();
