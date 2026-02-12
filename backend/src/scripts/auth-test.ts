import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Testing email_messages query directly...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    try {
        // Test 1: Check if table exists
        console.log('\n1. Checking if email_messages table exists...');
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'email_messages'
            );
        `;
        console.log('Table exists:', tableCheck[0].exists);

        if (!tableCheck[0].exists) {
            console.log('\n⚠️ Table does NOT exist! Need to run migration.');
            await sql.end();
            process.exit(1);
        }

        // Test 2: Check table columns
        console.log('\n2. Checking table columns...');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'email_messages'
            ORDER BY ordinal_position;
        `;
        console.log('Columns found:', columns.length);
        columns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

        // Test 3: Try the actual query that's failing
        console.log('\n3. Running the failing query...');
        const projectId = 'e4406870-47e4-4614-952d-d9a6fa97cb1e';
        const result = await sql`
            SELECT * FROM email_messages 
            WHERE project_id = ${projectId}::uuid 
            ORDER BY created_at DESC 
            LIMIT 20
        `;
        console.log('Query succeeded! Rows returned:', result.length);

        console.log('\n✓ All tests passed!');
        await sql.end();
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Error occurred:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        await sql.end();
        process.exit(1);
    }
}

main();
