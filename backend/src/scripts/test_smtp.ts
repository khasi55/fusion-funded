import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testEmail() {
    console.log('🧪 Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Verified!');

        const info = await transporter.sendMail({
            from: `"Fusion Funded Test" <${process.env.FROM_EMAIL}>`,
            to: 'viswanathtr@gmail.com', // Using a placeholder for safety, or user can provide
            subject: 'Test Email from Fusion Funded',
            text: 'This is a test email to verify the new SMTP configuration.',
            html: '<b>This is a test email to verify the new SMTP configuration.</b>',
        });

        console.log('✅ Test Email Sent!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Test Failed:', error);
    }
}

testEmail();
