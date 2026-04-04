
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test() {
    const { data, error } = await supabase.from('admin_users').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('❌ Error:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Success! Admin users count:', data);
    }
}

test();
