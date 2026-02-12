import { db } from '../db/db';
import { sql } from 'drizzle-orm';

async function listTables() {
    try {
        const result = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', result.map(r => r.table_name));
    } catch (error) {
        console.error('Error listing tables:', error);
    } finally {
        process.exit(0);
    }
}

listTables();
