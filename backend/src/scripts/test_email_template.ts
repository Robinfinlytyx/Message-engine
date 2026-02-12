import { db } from '../db/db';
import { emailService } from '../services/email.service';
import { emailTemplates } from '../db/schema/email_templates';
import { projects } from '../db/schema/projects';
import { eq } from 'drizzle-orm';

async function testEmailTemplates() {
    console.log('Starting Email Templating Test...');

    try {
        // 1. Get a project ID (assuming one exists, or create one)
        let project = await db.query.projects.findFirst();
        if (!project) {
            console.log('No project found, creating one...');
            const [newProject] = await db.insert(projects).values({
                name: 'Test Project',
                apiKey: 'test-api-key-' + Date.now(),
            }).returning();
            project = newProject;
        }
        console.log('Using project:', project.id);

        // 2. Create a template
        console.log('Creating template...');
        const templateData = {
            name: 'Welcome Template ' + Date.now(),
            subject: 'Welcome, {{name}}!',
            htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to {{appName}}.</p>',
            textContent: 'Hello {{name}}, Welcome to {{appName}}.',
            variables: ['name', 'appName'],
        };
        const template = await emailService.createTemplate(project.id, templateData);
        console.log('Template created:', template.id);

        // 3. Send email using template
        console.log('Sending email with template...');
        const emailRequest = {
            to: 'test@example.com',
            templateId: template.id,
            templateVariables: {
                name: 'John Doe',
                appName: 'My Super App',
            },
        } as any; // Cast as any because we extended the request type dynamically in the service but maybe not in the type definition yet

        const result = await emailService.sendEmail(emailRequest, project.id);
        console.log('Email sent:', result.messageId);

        // 4. Verify in DB
        console.log('Verifying email in DB...');
        const messages = await emailService.getEmailsByProject(project.id, 10, 0);
        const sentMessage = messages.data.find(m => m.id === result.messageId);

        if (sentMessage) {
            console.log('Message found in DB.');
            console.log('Subject:', sentMessage.subject); // Should be "Welcome, John Doe!"
            console.log('HTML:', sentMessage.htmlContent); // Should contain "Hello John Doe"

            if (sentMessage.subject === 'Welcome, John Doe!') {
                console.log('SUCCESS: Subject substitution worked.');
            } else {
                console.error('FAILURE: Subject substitution failed.');
            }
        } else {
            console.error('FAILURE: Message not found in DB.');
        }

        // Cleanup
        // await emailService.deleteTemplate(template.id);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testEmailTemplates();
