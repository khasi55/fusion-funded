import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function checkSync() {
    const email = 'khasireddy3@gmail.com';
    
    // Check profiles
    const { data: profile } = await supabase.from('profiles').select('id, email').eq('email', email).single();
    
    // We can't directly select from auth.users via standard supabase client usually 
    // unless we use a specific RPC or the management API, which might not be set up.
    // However, if the user is logged in, their session 'sub' is their auth.uid().

    console.log('Profile ID for', email, 'is:', profile?.id);

    // Let's check how many certificates exist TOTAL in the table
    const { data: totalCount } = await supabase.from('certificates').select('count', { count: 'exact', head: true });
    console.log('Total certificates in table:', totalCount);

    // Check if the user_id in certificates table actually matches any user in profiles
    const { data: allCerts } = await supabase.from('certificates').select('user_id, full_name, type');
    console.log('All certificates in table:', allCerts);
}

checkSync().catch(console.error);
