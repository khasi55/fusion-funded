import { supabase } from '../lib/supabase';

async function listAccountTypes() {
    console.log('📡 Fetching account types...');
    const { data, error } = await supabase.from('account_types').select('*');
    
    if (error) {
        console.error('❌ Error fetching account types:', error.message);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('⚠️ No account types found.');
        return;
    }
    
    console.log(`✅ Found ${data.length} account types:`);
    console.table(data);
}

listAccountTypes();
