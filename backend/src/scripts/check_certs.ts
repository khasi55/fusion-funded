import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function check() {
    const email = 'khasireddy3@gmail.com';
    
    // 1. Get user id
    const { data: profile } = await supabase.from('profiles').select('id, email').eq('email', email).single();
    if (!profile) {
        console.log('No profile found for', email);
        return;
    }
    console.log('User Profile:', profile);

    // 2. Check certificates
    const { data: certs } = await supabase.from('certificates').select('*').eq('user_id', profile.id);
    console.log(`Found ${certs?.length || 0} certificates for this user:`, certs);

    // 3. Check RLS/Policies (indirectly by trying to select without service role if possible, 
    // but here we use service role, so we just see if they exist)
}

check().catch(console.error);
