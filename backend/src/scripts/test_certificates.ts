import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { EmailService } from '../services/email-service';

async function test() {
    const testEmail = 'khasireddy3@gmail.com';
    const testName = 'Khasi Reddy';
    
    console.log(`🚀 Sending test Pass Certificate to ${testEmail}...`);
    await EmailService.sendPassCertificate(testEmail, testName, '123456', 50000);
    
    console.log(`🚀 Sending test Payout Certificate to ${testEmail}...`);
    await EmailService.sendPayoutCertificate(testEmail, testName, 1500);
    
    console.log('✅ Test emails dispatched.');
}

test().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
