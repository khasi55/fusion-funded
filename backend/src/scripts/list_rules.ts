import { supabase } from '../lib/supabase';

async function listRules() {
    console.log('📡 Fetching challenge type rules...');
    const { data, error } = await supabase.from('challenge_type_rules').select('*');
    
    if (error) {
        console.error('❌ Error fetching rules:', error.message);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('⚠️ No rules found.');
        return;
    }
    
    console.log(`✅ Found ${data.length} valid types:`);
    console.table(data);
}

listRules();
