import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log("Checking if bucket 'kyc-documents' already exists...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    const bucketExists = buckets.find(b => b.name === 'kyc-documents');
    if (bucketExists) {
        console.log("Bucket already exists. Ensuring it is public.");
        const { data, error } = await supabase.storage.updateBucket('kyc-documents', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 10485760, // 10MB
        });
        if (error) {
             console.error("Error updating bucket:", error);
        } else {
             console.log("Bucket updated to public successfully.");
        }
    } else {
        console.log("Creating bucket 'kyc-documents'...");
        const { data, error } = await supabase.storage.createBucket('kyc-documents', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 10485760, // 10MB
        });
        if (error) {
            console.error("Error creating bucket:", error);
        } else {
            console.log("Success! Bucket created:", data);
        }
    }
}

main();
