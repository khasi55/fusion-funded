import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['notifications', 'profiles', 'challenges', 'admin_users'];
    
    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error(`❌ Error on ${table}:`, error.message);
        } else {
            console.log(`✅ Table ${table} exists. Count: ${count}`);
        }
    }
}

check();
