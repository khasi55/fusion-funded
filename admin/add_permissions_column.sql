-- Consolidated Fix for admin_users table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS is_two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS webauthn_credentials jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_webauthn_enabled boolean DEFAULT false;

-- Create an index for faster permissions lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_permissions ON public.admin_users USING GIN (permissions);

COMMENT ON COLUMN public.admin_users.two_factor_secret IS 'Secret key for TOTP 2FA';
COMMENT ON COLUMN public.admin_users.webauthn_credentials IS 'Array of WebAuthn credentials (FaceID/TouchID)';
