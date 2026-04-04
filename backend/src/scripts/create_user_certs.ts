import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function createForUser() {
    const email = 'khasireddy3@gmail.com';
    
    // 1. Get the user
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single();
    
    if (error || !profile) {
        console.error('User not found for email:', email, error);
        return;
    }

    console.log(`Creating demo certs for ${profile.full_name} (${profile.id})...`);

    // 2. Create Pass Certificate
    await supabase.from('certificates').insert({
        user_id: profile.id,
        type: 'pass',
        certificate_number: 'FF-PASS-KHA-001',
        full_name: profile.full_name || 'Khasireddy',
        amount: 100000,
        issued_at: new Date().toISOString()
    });

    // 3. Create Payout Certificate
    await supabase.from('certificates').insert({
        user_id: profile.id,
        type: 'payout',
        certificate_number: 'FF-PAY-KHA-002',
        full_name: profile.full_name || 'Khasireddy',
        amount: 3250.00,
        issued_at: new Date().toISOString(),
        metadata: { transaction_id: 'sf_payout_demo_hash_999' }
    });

    console.log('✅ Certificates created for user.');
}

createForUser().catch(console.error);
