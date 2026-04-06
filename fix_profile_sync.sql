-- FIX PROFILE SYNC ON SIGNUP
-- Run this in your Supabase SQL Editor.

-- 1. Add 'country' column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country text;

-- 2. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Try to find referrer if code is provided in metadata
  IF new.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.profiles 
    WHERE referral_code = new.raw_user_meta_data->>'referral_code';
  END IF;

  -- Insert profile with full metadata extraction
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    referral_code, 
    referred_by,
    phone,
    country
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    NULL, -- No automatic code anymore
    referrer_id,
    new.raw_user_meta_data->>'phone_number', -- Note: frontend sends 'phone_number' metadata
    new.raw_user_meta_data->>'country'
  );
  
  -- Increment referral count for the referrer
  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET total_referrals = total_referrals + 1 
    WHERE id = referrer_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Confirmation message wrapped in a DO block
-- 4. Backfill existing users (One-time migration)
-- This will sync phone and country for users who signed up before this fix was applied.
DO $$ 
BEGIN
    UPDATE public.profiles p
    SET 
        phone = COALESCE(p.phone, (u.raw_user_meta_data->>'phone_number')),
        country = COALESCE(p.country, (u.raw_user_meta_data->>'country'))
    FROM auth.users u
    WHERE p.id = u.id
    AND (p.phone IS NULL OR p.country IS NULL);
    
    RAISE NOTICE 'Backfill for existing users completed.';
END $$;

DO $$ 
BEGIN
    RAISE NOTICE 'Profile sync fix applied successfully.';
END $$;
