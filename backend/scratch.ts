import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const projects = pgTable('projects', {
    id: text('id'),
    apiKey: text('api_key')
});

async function main() {
    try {
        // use an invalid database URL or try to connect to a postgres db and query a non-existent table
        // I will use a local postgres db if available, but let's just mock the error or check if it's reproducible.
    } catch (e) {
        console.error(e);
    }
}
main();
