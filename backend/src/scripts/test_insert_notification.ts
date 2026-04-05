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
    console.log('📡 Attempting to insert a test notification...');
    const { data, error } = await supabase.from('notifications').insert({
        title: 'System Stability Check',
        message: 'This is a test notification to verify database connectivity.',
        type: 'info',
        read: false
    }).select();
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Success! Notification created:', JSON.stringify(data, null, 2));
    }
}

check();
