import { supabase } from '../lib/supabase';

async function listChallenges() {
    console.log('📡 Fetching challenges...');
    const { data, error } = await supabase.from('challenges').select('id, login, group, status').limit(10);
    
    if (error) {
        console.error('❌ Error fetching challenges:', error.message);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('⚠️ No challenges found in the database.');
        return;
    }
    
    console.log(`✅ Found ${data.length} challenges:`);
    console.table(data);
}

listChallenges();
