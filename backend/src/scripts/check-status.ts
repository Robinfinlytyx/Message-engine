
import { db } from '../db/db';
import { whatsappMessages } from '../db/schema/whatsapp_messages';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        const statuses = await db
            .select({
                status: whatsappMessages.status,
                count: sql<number>`count(*)`
            })
            .from(whatsappMessages)
            .groupBy(whatsappMessages.status);

        console.log('Distinct Statuses in DB:', statuses);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
