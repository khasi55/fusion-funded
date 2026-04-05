import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();

        console.log("Connected to database. Running migration to add missing admin columns...");

        const sql = `
            ALTER TABLE public.admin_users
            ADD COLUMN IF NOT EXISTS last_seen timestamptz,
            ADD COLUMN IF NOT EXISTS daily_login_count integer DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_login_date date;
            
            COMMENT ON COLUMN public.admin_users.last_seen IS 'Timestamp of the admin last activity';
            COMMENT ON COLUMN public.admin_users.daily_login_count IS 'Count of logins for the current day';
            COMMENT ON COLUMN public.admin_users.last_login_date IS 'Date of the last login to track daily counts';
        `;

        await client.query(sql);
        console.log("Migration successful!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
