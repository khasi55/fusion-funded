-- 🛡️ [Funded Rules Fix] - No Profit Target for Funded Stage
-- This ensures that once a user moves to the Funded stage, no profit target is enforced.

-- 1. Lite Funded
UPDATE challenge_type_rules 
SET profit_target_percent = 0 
WHERE challenge_type = 'lite_funded';

-- 2. Prime Funded
UPDATE challenge_type_rules 
SET profit_target_percent = 0 
WHERE challenge_type = 'prime_funded';

-- 3. Standard Evaluation/Funded Fallbacks
UPDATE challenge_type_rules 
SET profit_target_percent = 0 
WHERE challenge_type IN ('funded', 'master', 'live');

-- 4. Verify existing challenges (optional but recommended)
-- Ensure 'funded' status accounts don't have a profit target in their specific metadata if overridden
UPDATE challenges
SET metadata = metadata || '{"profit_target_percent": 0}'
WHERE status = 'active' AND (challenge_type LIKE '%funded%' OR challenge_type LIKE '%master%');

-- ✅ Done. Funded accounts will now show "No Profit Target" or 0 on the dashboard.
