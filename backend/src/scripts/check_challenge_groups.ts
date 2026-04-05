import { supabase } from '../lib/supabase';

async function checkChallengeGroups() {
    console.log('📡 Fetching challenges...');
    const { data, error } = await supabase
        .from('challenges')
        .select('id, login, group, challenge_type, status')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }
    
    console.table(data);
}

checkChallengeGroups();
