import { createMT5Account } from '../lib/mt5-bridge';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from the root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkBridge() {
    console.log('🔍 Checking Bridge Configuration on Server...');
    console.log('URL:', process.env.MT5_BRIDGE_URL);
    console.log('API Key (Head):', process.env.MT5_BRIDGE_API_KEY?.substring(0, 8));

    const testParams = {
        name: 'Server Test',
        email: 'server_test@example.com',
        group: 'AUS\\Live\\7401\\grp2',
        leverage: 100,
        balance: 1000,
    };

    try {
        console.log(`🔌 Attempting to create account in ${testParams.group}...`);
        const result = await createMT5Account(testParams);
        console.log('✅ SUCCESS! Bridge responded:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('❌ FAILURE! Bridge error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

checkBridge();
