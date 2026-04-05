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
    console.log('📡 Checking columns for notifications table...');
    const { data: sample, error } = await supabase.from('notifications').select('*').limit(1).single();
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Notification Columns:', Object.keys(sample));
    }
}

check();
