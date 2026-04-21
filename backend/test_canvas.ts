import { Canvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

async function generateTest() {
    console.log("Loading allocation_template.jpg...");
    const allocationImg = await loadImage(path.join(__dirname, 'src/assets/certificates/allocation_template.jpg'));
    console.log(`Allocation size: ${allocationImg.width} x ${allocationImg.height}`);
    
    // Draw Allocation
    const allocCanvas = new Canvas(allocationImg.width, allocationImg.height);
    const allocCtx = allocCanvas.getContext('2d');
    allocCtx.drawImage(allocationImg, 0, 0);

    allocCtx.font = 'bold 36px Arial';
    allocCtx.fillStyle = '#000000';
    allocCtx.textAlign = 'center';
    
    // Test Name
    const nameY = allocationImg.height * 0.55; 
    allocCtx.fillText("JOHN DOE", allocationImg.width / 2, nameY);
    
    // Test Account Size
    const accountSizeX = allocationImg.width * 0.3;
    const accountY = allocationImg.height * 0.9;
    allocCtx.font = 'bold 24px Arial';
    allocCtx.fillText("$100,000", accountSizeX, accountY);
    
    // Test Date
    const dateX = allocationImg.width * 0.75;
    allocCtx.fillText("April 19, 2026", dateX, accountY);

    fs.writeFileSync('alloc_test.jpg', allocCanvas.toBuffer('image/jpeg'));
    console.log("Saved alloc_test.jpg");

    console.log("Loading payout_template.jpg...");
    const payoutImg = await loadImage(path.join(__dirname, 'src/assets/certificates/payout_template.jpg'));
    console.log(`Payout size: ${payoutImg.width} x ${payoutImg.height}`);
    
    const payoutCanvas = new Canvas(payoutImg.width, payoutImg.height);
    const payoutCtx = payoutCanvas.getContext('2d');
    payoutCtx.drawImage(payoutImg, 0, 0);
    
    payoutCtx.font = 'bold 36px Arial';
    payoutCtx.fillStyle = '#ffffff';
    payoutCtx.textAlign = 'center';
    
    // Test Name
    payoutCtx.fillText("JOHN SMITH", payoutImg.width / 2, payoutImg.height * 0.32);
    
    // Test Amount
    payoutCtx.font = 'bold 48px Arial';
    payoutCtx.fillText("$5,000", payoutImg.width / 2, payoutImg.height * 0.5);
    
    // Test Date
    payoutCtx.font = 'bold 24px Arial';
    payoutCtx.textAlign = 'left';
    payoutCtx.fillText("April 19, 2026", payoutImg.width * 0.18, payoutImg.height * 0.81);
    
    fs.writeFileSync('payout_test.jpg', payoutCanvas.toBuffer('image/jpeg'));
    console.log("Saved payout_test.jpg");
}

generateTest().catch(console.error);
