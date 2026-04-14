import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const backendUrl = 'http://localhost:3001';
const adminApiKey = process.env.ADMIN_API_KEY || 'sharkfunded_admin_secret_key_2026';

async function reproduce() {
    console.log('🧪 Attempting to reproduce Admin Assign Error...');

    // We'll mimic the POST /api/mt5/assign request
    const payload = {
        email: 'khasireddy3@gmail.com',
        mt5Group: 'AUS\\contest\\7401\\grp2',
        accountSize: 100000,
        planType: 'HFT 2.0 Phase 1 (grp2)'
    };

    console.log('📡 Payload:', JSON.stringify(payload, null, 2));

    try {
        // Instead of calling the API which requires auth, we'll directly call the bridge lib
        // to see if the error persists when called from a "backend-like" environment.
        const { createMT5Account } = require('./src/lib/mt5-bridge');
        
        console.log('🔌 Calling bridge directly...');
        const result = await createMT5Account({
            name: 'Test Admin Assign',
            email: payload.email,
            group: payload.mt5Group,
            leverage: 100,
            balance: payload.accountSize,
            callback_url: 'https://api.fusionfunded.co/api/webhooks/mt5'
        });

        console.log('✅ Success:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Error caught:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

reproduce();
