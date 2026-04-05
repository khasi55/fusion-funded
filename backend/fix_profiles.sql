-- SQL Migration to fix missing columns in the profiles table
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/dqzafsvhqfdhgiqexdct/sql/new)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(15, 2) DEFAULT 0.00;

-- Add Bank Details table
CREATE TABLE IF NOT EXISTS public.bank_details (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT,
    swift_code TEXT,
    is_locked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled or open for authenticated users
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bank details" ON public.bank_details FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank details" ON public.bank_details FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank details" ON public.bank_details FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
