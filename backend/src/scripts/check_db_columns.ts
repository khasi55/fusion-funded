import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    console.log('📡 Checking columns for challenges table...');
    const { data, error } = await supabase.from('challenges').select('*').limit(1).single();
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Challenge Columns:', Object.keys(data));
    }
}

check();
