
import { EmailService } from '../services/email-service';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runTest() {
    const testEmail = 'test-receiver@example.com';
    const testName = 'Test User';
    
    console.log('🚀 Starting Full Email Suite Test (V2 - Corrected)...');
    console.log(`📍 Redirect Target: ${process.env.DEBUG_EMAIL_REDIRECT || 'None (Live)'}`);
    console.log('--------------------------------------------------');

    try {
        // 1. Account Credentials
        console.log('✉️ Sending Account Credentials...');
        await EmailService.sendAccountCredentials(
            testEmail, 
            testName, 
            '12345678', 
            'MasterPass123!', 
            'Fusion-Server-01', 
            'InvestPass456'
        );

        // 2. Order Rejected (New)
        console.log('✉️ Sending Order Rejected Notice...');
        await EmailService.sendOrderRejectedNotice(
            testEmail, 
            testName, 
            'ORD-REJECT-999', 
            'Transaction proof could not be verified on the blockchain.'
        );

        // 3. KYC Rejected (New)
        console.log('✉️ Sending KYC Rejected Notice...');
        await EmailService.sendKYCRejectedNotice(
            testEmail, 
            testName, 
            'ID document was blurry and the edges were cut off.'
        );

        // 4. Competition Joined
        console.log('✉️ Sending Competition Joined Notice...');
        await EmailService.sendCompetitionJoined(testEmail, testName, 'Fusion Monthly Challenge April');

        // 5. Pass Notification
        console.log('✉️ Sending Pass Notification...');
        await EmailService.sendPassNotification(testEmail, testName, '123456', 'HFT Phase 1');

        // 6. Payout Requested
        console.log('✉️ Sending Payout Requested Notice...');
        await EmailService.sendPayoutRequestedNotice(testEmail, testName, 1000, 'USDT (ERC20)');

        // 7. Payout Approved
        console.log('✉️ Sending Payout Approved Notice...');
        await EmailService.sendPayoutApprovedNotice(testEmail, testName, 1000, 'TXN-987654321');

        // 8. Payout Rejected
        console.log('✉️ Sending Payout Rejected Notice...');
        await EmailService.sendPayoutRejectedNotice(testEmail, testName, 1500, 'Violation of Consistency Rule: Lot size variance too high.');

        console.log('--------------------------------------------------');
        console.log('✅ All emails sent to queue successfully!');
        console.log('Check khasireddy32@gmail.com in a few moments.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
