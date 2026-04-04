-- ==========================================
-- CRITICAL DATABASE FIXES FOR SHARKFUNDED
-- ==========================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- to fix Affiliate and Coupon errors.

-- 1. FIX AFFILIATE COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_status TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_request_date TIMESTAMPTZ DEFAULT NULL;

-- Pre-approve existing affiliates
UPDATE public.profiles 
SET affiliate_status = 'approved' 
WHERE referral_code IS NOT NULL AND affiliate_status IS NULL;


-- 2. FIX COUPON VALIDATION FUNCTION
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code TEXT,
    p_user_id UUID,
    p_amount NUMERIC,
    p_account_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
    is_valid BOOLEAN,
    message TEXT,
    discount_amount NUMERIC,
    discount_type TEXT,
    discount_value NUMERIC,
    coupon_id UUID,
    affiliate_id UUID,
    commission_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon RECORD;
    v_user_uses INTEGER;
    v_discount_amount NUMERIC := 0;
BEGIN
    -- 1. Find the coupon (Case-insensitive)
    SELECT * INTO v_coupon
    FROM public.discount_coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code))
    AND is_active = true
    LIMIT 1;

    -- 2. Basic Existence Check
    IF v_coupon.id IS NULL THEN
        RETURN QUERY SELECT false, 'Invalid coupon code'::TEXT, 0::NUMERIC, NULL::TEXT, NULL::NUMERIC, NULL::UUID, NULL::UUID, NULL::NUMERIC;
        RETURN;
    END IF;

    -- 3. Expiration Check
    IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > NOW() THEN
        RETURN QUERY SELECT false, 'Coupon is not yet active'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
        RETURN;
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN QUERY SELECT false, 'Coupon has expired'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
        RETURN;
    END IF;

    -- 4. Minimum Amount Check
    IF v_coupon.min_purchase_amount IS NOT NULL AND p_amount < v_coupon.min_purchase_amount THEN
        RETURN QUERY SELECT false, 'Minimum purchase amount not met'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
        RETURN;
    END IF;

    -- 5. Total Usage Check
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, 'Coupon usage limit reached'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
        RETURN;
    END IF;

    -- 6. User Usage Check (If user_id is provided and not dummy)
    IF p_user_id IS NOT NULL AND p_user_id != '00000000-0000-0000-0000-000000000000'::UUID THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM public.payment_orders
        WHERE user_id = p_user_id
        AND coupon_code = v_coupon.code
        AND status = 'paid';

        IF v_coupon.max_uses_per_user IS NOT NULL AND v_user_uses >= v_coupon.max_uses_per_user THEN
            RETURN QUERY SELECT false, 'Coupon already used'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
            RETURN;
        END IF;
    END IF;

    -- 7. Account Type Check
    IF p_account_type != 'all' AND v_coupon.account_types IS NOT NULL AND array_length(v_coupon.account_types, 1) > 0 THEN
        IF NOT (p_account_type = ANY(v_coupon.account_types)) THEN
            RETURN QUERY SELECT false, 'Coupon not valid for this account type'::TEXT, 0::NUMERIC, v_coupon.discount_type, v_coupon.discount_value, v_coupon.id, v_coupon.affiliate_id, v_coupon.commission_rate;
            RETURN;
        END IF;
    END IF;

    -- 8. Calculate Discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount_amount := (p_amount * v_coupon.discount_value / 100);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
            v_discount_amount := v_coupon.max_discount_amount;
        END IF;
    ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount_amount := v_coupon.discount_value;
        IF v_discount_amount > p_amount THEN
            v_discount_amount := p_amount;
        END IF;
    END IF;

    -- 9. Return Success
    RETURN QUERY SELECT 
        true, 
        'Coupon applied successfully'::TEXT, 
        ROUND(v_discount_amount, 2), 
        v_coupon.discount_type, 
        v_coupon.discount_value, 
        v_coupon.id, 
        v_coupon.affiliate_id, 
        v_coupon.commission_rate;
END;
$$;
