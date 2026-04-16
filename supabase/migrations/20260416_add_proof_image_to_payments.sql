-- Add proof_image column to payment_orders
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS proof_image TEXT;

-- Backfill proof_image from metadata if it exists
UPDATE public.payment_orders 
SET proof_image = metadata->>'proof_url'
WHERE proof_image IS NULL 
AND metadata ? 'proof_url';

-- Ensure the column is indexed for performance if needed (optional but good practice)
-- CREATE INDEX IF NOT EXISTS idx_payment_orders_proof_image ON public.payment_orders(proof_image) WHERE proof_image IS NOT NULL;
