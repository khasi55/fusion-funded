-- Migration to fix affiliate_withdrawals schema
-- Adding missing columns expected by the backend status update route

ALTER TABLE public.affiliate_withdrawals 
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Sync existing data from 'notes' to 'rejection_reason' if rejection_reason is null
-- This ensures that any previously entered rejection reasons (stored in notes) are preserved in the new column
UPDATE public.affiliate_withdrawals 
SET rejection_reason = notes 
WHERE rejection_reason IS NULL AND notes IS NOT NULL;

-- Optional: If you want to keep the schema clean, you could eventually drop the 'notes' column
-- but it's safer to keep it for now.
-- ALTER TABLE public.affiliate_withdrawals DROP COLUMN IF EXISTS notes;
