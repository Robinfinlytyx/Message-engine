import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log("Testing connection without explicit ssl...");
    const client1 = postgres(process.env.DATABASE_URL!);
    try {
        const res = await client1`SELECT 1 as val`;
        console.log("Without SSL worked:", res);
    } catch (e: any) {
        console.error("Without SSL failed:", e.message);
    } finally {
        await client1.end();
    }

    console.log("\nTesting connection with explicit ssl: 'require'...");
    const client2 = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    try {
        const res = await client2`SELECT 1 as val`;
        console.log("With SSL worked:", res);
    } catch (e: any) {
        console.error("With SSL failed:", e.message);
    } finally {
        await client2.end();
    }
}

testConnection().catch(console.error);
