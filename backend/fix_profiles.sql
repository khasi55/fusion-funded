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

-- Optional: Update RLS if needed (usually not required if already open)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
