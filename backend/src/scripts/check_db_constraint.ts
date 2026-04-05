import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkConstraint() {
    console.log('📡 Fetching constraint definition for challenges table...');
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
            SELECT pg_get_constraintdef(oid) as def
            FROM pg_constraint 
            WHERE conrelid = 'challenges'::regclass 
            AND conname = 'valid_challenge_type';
        `
    });
    
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }
    
    console.log('✅ Constraint Definition:', JSON.stringify(data, null, 2));
}

checkConstraint();
