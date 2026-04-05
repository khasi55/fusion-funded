import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    const login = 900909609742;
    console.log(`Checking challenge for login: ${login}...`);
    const { data, error } = await supabase
        .from('challenges')
        .select('id, login, status, current_equity, current_balance')
        .eq('login', login)
        .single();
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Challenge Data:', JSON.stringify(data, null, 2));
    }
}

check();
