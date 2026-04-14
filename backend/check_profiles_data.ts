import { supabase } from './src/lib/supabase';

async function checkData() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, email')
        .limit(10);
    
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profile Data (first 10):');
        profiles.forEach(p => console.log(JSON.stringify(p)));
    }
}

checkData();
