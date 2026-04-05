import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const bridgeUrl = process.env.MT5_BRIDGE_URL || 'https://fusion.sharkfunded.co';
const apiKey = process.env.MT5_BRIDGE_API_KEY || '';

async function verifyBridge() {
    console.log('🔍 Verifying Bridge Connectivity...');
    console.log(`URL: ${bridgeUrl}`);
    
    try {
        const start = Date.now();
        const response = await fetch(`${bridgeUrl}/get-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ login: 12345 }) // Dummy login
        });

        const duration = Date.now() - start;
        console.log(`📡 Response Status: ${response.status} (${duration}ms)`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Bridge is REACHABLE and API Key is VALID.');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.error(`❌ Bridge returned error: ${response.status}`);
            console.error('Error Details:', errorText);
            
            if (response.status === 401 || response.status === 403) {
                console.error('⚠️ Likely API Key issue.');
            } else if (response.status === 404) {
                console.error('⚠️ Endpoint /get-history not found. Testing root...');
                const rootRes = await fetch(bridgeUrl);
                console.log(`Root status: ${rootRes.status}`);
            }
        }
    } catch (error: any) {
        console.error('❌ Failed to connect to bridge:', error.message);
    }
}

verifyBridge();
