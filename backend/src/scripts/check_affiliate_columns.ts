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

async function checkColumns() {
    console.log('🔍 Checking affiliate_withdrawals columns...');
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'affiliate_withdrawals' });
    
    // If we don't have this RPC, we can try a direct query to information_schema if we have permissions, 
    // or just try to select some common columns to see which ones fail.
    
    if (error) {
        console.log('Trying alternative check (select * limit 1)...');
        const { data: sampleData, error: selectError } = await supabase.from('affiliate_withdrawals').select('*').limit(1);
        if (selectError) {
            console.error('❌ Error selecting from affiliate_withdrawals:', selectError.message);
        } else if (sampleData && sampleData.length > 0) {
            console.log('✅ Found columns:', Object.keys(sampleData[0]));
        } else {
            console.log('Table is empty, cannot infer columns from select *');
            // Try to select transaction_id specifically
            const { error: colError } = await supabase.from('affiliate_withdrawals').select('transaction_id').limit(1);
            if (colError) {
                console.log('❌ Column transaction_id likely missing:', colError.message);
            } else {
                console.log('✅ Column transaction_id exists!');
            }
        }
    } else {
        console.log('✅ Columns:', data);
    }
}

checkColumns();
