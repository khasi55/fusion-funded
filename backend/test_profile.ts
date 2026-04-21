import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, './.env') });
import { supabase } from './src/lib/supabase';

async function check() {
    const { data } = await supabase.from('profiles').select('id').eq('email', 'siddareddy1947@gmail.com').single();
    if (data) {
        console.log("Profile ID:", data.id);
    } else {
        console.log("No profile found for email");
    }
}
check();
