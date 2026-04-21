import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, './.env') });

import { CertificateService } from './src/services/certificate-service';
import fs from 'fs';

async function testService() {
    console.log("Testing Allocation Certificate...");
    const allocBuffer = await CertificateService.generateAllocationCertificate(
        "test-user-id-123",
        "KHASI REDDY",
        100000
    );
    if (allocBuffer) {
        fs.writeFileSync('alloc_final.pdf', allocBuffer);
        console.log("Saved alloc_final.pdf");
    } else {
        console.error("Failed to generate allocation certificate");
    }

    console.log("\nTesting Payout Certificate...");
    const payoutBuffer = await CertificateService.generatePayoutCertificate(
        "test-user-id-123",
        "VISWA REDDY",
        15000
    );
    if (payoutBuffer) {
        fs.writeFileSync('payout_final.pdf', payoutBuffer);
        console.log("Saved payout_final.pdf");
    } else {
        console.error("Failed to generate payout certificate");
    }
}

testService().catch(console.error);
