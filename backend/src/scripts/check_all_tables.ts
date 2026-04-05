import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    const tables = [
        'notifications', 'profiles', 'challenges', 'admin_users', 
        'trades', 'risk_rules_config', 'payouts', 'kyc_sessions',
        'api_sessions', 'admin_logs', 'coupons'
    ];
    
    console.log('🔍 Checking database tables...');
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ ${table.padEnd(20)}: ${error.message}`);
        } else {
            console.log(`✅ ${table.padEnd(20)}: OK`);
        }
    }
}

check();
