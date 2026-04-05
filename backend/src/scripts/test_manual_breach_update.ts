import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testUpdate() {
    const login = 900909609742;
    console.log(`📡 Attempting to manually update status for login ${login} to 'breached'...`);
    
    const { data, error } = await supabase
        .from('challenges')
        .update({ status: 'breached' })
        .eq('login', login)
        .select();
    
    if (error) {
        console.error('❌ Update Failed:', error.message);
    } else {
        console.log('✅ Update Success! New Status:', data?.[0]?.status);
    }
}

testUpdate();
