import { emailService } from '../services/email.service';
import { db } from '../db/db';
import { emailTemplates } from '../db/schema/email_templates';
import { eq } from 'drizzle-orm';
// import { logger } from '../utils/logger';

async function testVariableExtraction() {
    console.log('Starting Variable Extraction Test...');

    // 1. Create a dummy project (or just use a fake UUID if constraints allow, but likely need real project)
    // Actually, let's use an existing project ID from previous context if possible, or fetch one.
    // Fetch a project
    const project = await db.query.projects.findFirst();
    if (!project) {
        console.error('No project found to test with.');
        process.exit(1);
    }
    const projectId = project.id;
    console.log(`Using Project ID: ${projectId}`);

    // 2. Create a template WITHOUT variables
    const templateName = `AutoExtract Test ${Date.now()}`;
    console.log(`Creating template: ${templateName}`);

    try {
        const template = await emailService.createTemplate(projectId, {
            name: templateName,
            subject: 'Hello {{userName}}',
            htmlContent: '<p>Welcome to {{appName}}, {{userName}}!</p>',
            textContent: 'Welcome to {{appName}}, {{userName}}!',
            variables: [] // Explicitly empty
        });

        console.log('Template created:', template.id);
        console.log('Extracted Variables:', template.variables);

        if (template.variables && template.variables.length === 2 &&
            template.variables.includes('userName') && template.variables.includes('appName')) {
            console.log('✅ PASS: Variables extracted correctly on creation.');
        } else {
            console.error('❌ FAIL: Variables not extracted correctly on creation.', template.variables);
        }

        // 3. Update the template with NEW variables
        console.log('Updating template with new content...');
        const updated = await emailService.updateTemplate(template.id, {
            subject: 'Reminder: {{dueDate}} is approaching',
            htmlContent: '<p>Hi {{userName}}, pay by {{dueDate}}.</p>'
        });

        console.log('Template updated:', updated.id);
        console.log('Updated Variables:', updated.variables);

        if (updated.variables && updated.variables.length === 2 &&
            updated.variables.includes('userName') && updated.variables.includes('dueDate')) {
            console.log('✅ PASS: Variables updated correctly on modification.');
        } else {
            console.error('❌ FAIL: Variables not updated correctly.', updated.variables);
        }

        // Cleanup
        await emailService.deleteTemplate(template.id);
        console.log('Cleanup: Template deleted.');

    } catch (error) {
        console.error('Test failed with error:', error);
    }

    process.exit(0);
}

testVariableExtraction();
