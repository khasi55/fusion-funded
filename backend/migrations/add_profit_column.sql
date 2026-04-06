-- Migration to add a generated net_profit column to the challenges table
-- This column will automatically calculate the profit as (current_balance - initial_balance)
-- and store it for efficient sorting in the admin portal.

ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS net_profit numeric 
GENERATED ALWAYS AS (current_balance - initial_balance) STORED;

-- Add an index for faster sorting by profit
CREATE INDEX IF NOT EXISTS idx_challenges_net_profit ON public.challenges(net_profit);
