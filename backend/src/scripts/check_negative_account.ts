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
    const login = 900909609741;
    console.log(`🔍 Checking challenge record for login: ${login}...`);
    const { data: challenge, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('login', login)
        .single();
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Challenge Data:', JSON.stringify(challenge, null, 2));
        
        // Also check trades
        const { data: trades, error: tError } = await supabase
            .from('trades')
            .select('*')
            .eq('challenge_id', challenge.id);
        
        if (tError) {
             console.error('❌ Trades Error:', tError.message);
        } else {
            console.log(`📦 Trades Count: ${trades.length}`);
            if (trades.length > 0) {
                 console.log('Sample Trade:', JSON.stringify(trades[0], null, 2));
            }
        }
    }
}

check();
