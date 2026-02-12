import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Running Simple Migration...');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    try {
        // Create email_batches first (referenced by email_messages)
        console.log('Creating email_batches table...');
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS email_batches (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                project_id uuid NOT NULL,
                name text,
                total_emails integer DEFAULT 0 NOT NULL,
                processed_count integer DEFAULT 0 NOT NULL,
                success_count integer DEFAULT 0 NOT NULL,
                failed_count integer DEFAULT 0 NOT NULL,
                batch_size integer DEFAULT 100 NOT NULL,
                status varchar(50) DEFAULT 'QUEUED' NOT NULL,
                metadata jsonb,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL,
                completed_at timestamp
            );
        `);
        console.log('✓ email_batches created');

        // Create email_messages
        console.log('Creating email_messages table...');
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS email_messages (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                project_id uuid NOT NULL,
                "to" text NOT NULL,
                cc jsonb,
                bcc jsonb,
                "from" text,
                reply_to text,
                subject text NOT NULL,
                template_name text,
                html_content text,
                text_content text,
                template_variables jsonb,
                attachments jsonb,
                provider varchar(50) DEFAULT 'sendgrid' NOT NULL,
                provider_message_id text,
                status varchar(50) DEFAULT 'QUEUED' NOT NULL,
                error jsonb,
                is_opened boolean DEFAULT false,
                is_clicked boolean DEFAULT false,
                is_bounced boolean DEFAULT false,
                is_unsubscribed boolean DEFAULT false,
                batch_id uuid,
                retry_count integer DEFAULT 0 NOT NULL,
                max_retries integer DEFAULT 3 NOT NULL,
                next_retry_at timestamp,
                scheduled_message_id uuid,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL,
                sent_at timestamp,
                delivered_at timestamp,
                opened_at timestamp,
                clicked_at timestamp
            );
        `);
        console.log('✓ email_messages created');

        console.log('Migration complete!');
        await sql.end();
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        await sql.end();
        process.exit(1);
    }
}

main();
