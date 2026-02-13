import { db, schema } from '../db/db';

async function getApiKey() {
    try {
        const projects = await db.query.projects.findMany();
        if (projects.length === 0) {
            console.log('No projects found.');
        } else {
            for (const p of projects) {
                console.log(`NAME: ${p.name}`);
                console.log(`KEY: ${p.apiKey}`);
                console.log(`STATUS: ${p.status}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error fetching API key:', error);
        process.exit(1);
    }
}

getApiKey();
