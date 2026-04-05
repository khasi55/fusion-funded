import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function createTable() {
    console.log('📡 Creating notifications table via SQL RPC...');
    const sql = `
        CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            read BOOLEAN DEFAULT false,
            user_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Admin Policy
        DROP POLICY IF EXISTS "Admins can do everything on notifications" ON public.notifications;
        CREATE POLICY "Admins can do everything on notifications"
            ON public.notifications
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
        console.error('❌ SQL Execution Error:', error.message);
        console.log('💡 Note: If exec_sql RPC is missing, please run this SQL manually in the Supabase SQL Editor.');
    } else {
        console.log('✅ Success! Notifications table created or verified.');
    }
}

createTable();
