import { Canvas, loadImage, registerFont } from 'canvas';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

export class CertificateService {
    // Template paths
    private static ALLOCATION_TEMPLATE = path.join(__dirname, '../assets/certificates/allocation_template.jpg');
    private static PAYOUT_TEMPLATE = path.join(__dirname, '../assets/certificates/payout_template.jpg');

    /**
     * Generates an Allocation (Pass) Certificate
     * Returns the PDF Buffer for email attachment.
     */
    static async generateAllocationCertificate(
        userId: string, 
        name: string, 
        accountSize: number
    ): Promise<Buffer | null> {
        try {
            console.log(`Generating Allocation Certificate for ${name}...`);
            const img = await loadImage(this.ALLOCATION_TEMPLATE);
            const canvas = new Canvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            
            // Draw Background
            ctx.drawImage(img, 0, 0);

            // Draw Name (Center)
            ctx.font = 'bold 44px Arial';
            ctx.fillStyle = '#1A1A1A';
            ctx.textAlign = 'center';
            ctx.fillText(name.toUpperCase(), img.width / 2, img.height * 0.50);

            // Draw Account Size
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#1A1A1A';
            ctx.textAlign = 'center';
            ctx.fillText(`$${accountSize.toLocaleString()}`, img.width * 0.30, img.height * 0.76);

            // Draw Date
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            ctx.font = 'bold 24px Arial';
            ctx.fillText(today, img.width * 0.73, img.height * 0.76);

            // 1. Get JPEG Buffer
            const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

            // 2. Upload to Supabase and save in DB
            const certId = `CERT-PASS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            await this.saveToDatabase(userId, certId, 'pass', jpegBuffer, { account_size: accountSize, date: today });

            // 3. Convert to PDF Buffer
            return await this.convertToPDF(jpegBuffer, img.width, img.height);
            
        } catch (error) {
            console.error('Error generating allocation certificate:', error);
            return null;
        }
    }

    /**
     * Generates a Payout Certificate
     * Returns the PDF Buffer for email attachment.
     */
    static async generatePayoutCertificate(
        userId: string, 
        name: string, 
        payoutAmount: number
    ): Promise<Buffer | null> {
        try {
            console.log(`Generating Payout Certificate for ${name}...`);
            const img = await loadImage(this.PAYOUT_TEMPLATE);
            const canvas = new Canvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            
            // Draw Background
            ctx.drawImage(img, 0, 0);

            // Draw Name
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(name.toUpperCase(), img.width / 2, img.height * 0.33);

            // Draw Payout Amount
            ctx.font = 'bold 56px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`$${payoutAmount.toLocaleString()}`, img.width / 2, img.height * 0.56);

            // Draw Date
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(today, img.width * 0.22, img.height * 0.765);

            // 1. Get JPEG Buffer
            const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

            // 2. Upload to Supabase and save in DB
            const certId = `CERT-PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            await this.saveToDatabase(userId, certId, 'payout', jpegBuffer, { payout_amount: payoutAmount, date: today });

            // 3. Convert to PDF Buffer
            return await this.convertToPDF(jpegBuffer, img.width, img.height);
            
        } catch (error) {
            console.error('Error generating payout certificate:', error);
            return null;
        }
    }

    /**
     * Uploads the JPEG buffer to Supabase Storage and inserts a row into the certificates table
     */
    private static async saveToDatabase(
        userId: string, 
        certId: string, 
        type: 'pass' | 'payout', 
        imageBuffer: Buffer,
        metadata: any
    ) {
        try {
            const fileName = `${userId}/${certId}.jpg`;
            const bucketName = 'certificates';
            
            // Check and create bucket if it doesn't exist
            const { data: buckets } = await supabase.storage.listBuckets();
            const bucketExists = buckets?.some(b => b.name === bucketName);
            
            if (!bucketExists) {
                await supabase.storage.createBucket(bucketName, { public: true });
                console.log(`Created new public storage bucket: ${bucketName}`);
            }
            
            // Upload explicitly to 'certificates' bucket
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error("Failed to upload certificate image to Supabase:", uploadError);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            const fileUrl = publicUrlData.publicUrl;

            // Insert DB Record
            const dbPayload = {
                user_id: userId,
                type: type,
                certificate_number: certId,
                full_name: metadata.account_size ? 'Trader' : 'Trader', // Default name or passed in metadata if possible
                amount: type === 'pass' ? metadata.account_size : metadata.payout_amount,
                metadata: { ...metadata, image_url: fileUrl } // Store URL securely in metadata
            };

            const { error: dbError } = await supabase
                .from('certificates')
                .insert(dbPayload);

            if (dbError) {
                console.error("Failed to insert certificate into DB:", dbError);
            } else {
                console.log(`Successfully saved ${type} certificate ${certId} to Database.`);
            }

        } catch (error) {
            console.error("Error in saveToDatabase:", error);
        }
    }

    /**
     * Embeds a JPEG buffer into a high-quality PDF using pdf-lib
     */
    private static async convertToPDF(jpegBuffer: Buffer, width: number, height: number): Promise<Buffer> {
        const pdfDoc = await PDFDocument.create();
        
        // Create a blank page exactly the dimensions of the image
        const page = pdfDoc.addPage([width, height]);
        
        // Embed the JPEG into the PDF
        const pdfImage = await pdfDoc.embedJpg(jpegBuffer);
        
        // Draw the image onto the page matching the bounds exactly
        page.drawImage(pdfImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
        });

        // Save as a byte array
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
}
