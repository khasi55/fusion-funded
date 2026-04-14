import { supabase } from './src/lib/supabase';

async function checkChallenges() {
    const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, user_id, status')
        .eq('status', 'active')
        .limit(10);
    
    if (error) {
        console.error('Error fetching challenges:', error);
    } else {
        console.log('Active Challenges (first 10):');
        challenges.forEach(c => console.log(JSON.stringify(c)));
    }
}

checkChallenges();
