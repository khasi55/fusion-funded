-- Add affiliate status columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_status TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_request_date TIMESTAMPTZ DEFAULT NULL;

-- Pre-approve existing affiliates to avoid getting locked out of their dashboard
UPDATE profiles SET affiliate_status = 'approved' WHERE referral_code IS NOT NULL AND affiliate_status IS NULL;
