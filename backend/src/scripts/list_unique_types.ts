import { supabase } from '../lib/supabase';

async function listUniqueTypes() {
    console.log('📡 Fetching unique challenge types...');
    const { data, error } = await supabase.from('challenges').select('challenge_type');
    
    if (error) {
        console.error('❌ Error fetching challenges:', error.message);
        return;
    }
    
    const types = Array.from(new Set(data?.map(c => c.challenge_type).filter(Boolean)));
    console.log(`✅ Unique types:`, types);
}

listUniqueTypes();
