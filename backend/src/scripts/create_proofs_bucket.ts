import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const bucketName = 'proofs';
    console.log(`Checking if bucket '${bucketName}' exists...`);
    const { data: buckets, error: fetchError } = await supabase.storage.listBuckets();
    
    if (fetchError) {
        console.error("Failed to fetch buckets:", fetchError);
        process.exit(1);
    }
    
    const exists = buckets.some(b => b.name === bucketName);
    
    if (exists) {
        console.log(`Bucket '${bucketName}' already exists.`);
    } else {
        console.log(`Bucket '${bucketName}' not found. Creating it...`);
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'],
            fileSizeLimit: 10485760 // 10MB
        });
        
        if (error) {
            console.error("Failed to create bucket:", error);
            process.exit(1);
        }
        
        console.log(`✅ Bucket '${bucketName}' created successfully!`);
    }
}

main().catch(console.error);
