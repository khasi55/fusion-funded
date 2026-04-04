import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function createDemo() {
    // 1. Get a random user
    const { data: profile } = await supabase.from('profiles').select('id, full_name').limit(1).single();
    
    if (!profile) {
        console.error('No profile found');
        return;
    }

    console.log(`Creating demo certs for ${profile.full_name} (${profile.id})...`);

    // 2. Create Pass Certificate
    await supabase.from('certificates').insert({
        user_id: profile.id,
        type: 'pass',
        certificate_number: 'DEMO-PASS-123',
        full_name: profile.full_name || 'Demo Trader',
        amount: 50000,
        issued_at: new Date().toISOString()
    });

    // 3. Create Payout Certificate
    await supabase.from('certificates').insert({
        user_id: profile.id,
        type: 'payout',
        certificate_number: 'DEMO-PAY-456',
        full_name: profile.full_name || 'Demo Trader',
        amount: 1575.50,
        issued_at: new Date().toISOString(),
        metadata: { transaction_id: 'demo_tx_hash_123' }
    });

    console.log('✅ Demo certificates created.');
}

createDemo().catch(console.error);
