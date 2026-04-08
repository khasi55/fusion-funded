-- FORCE DELETE USER SQL SCRIPT
-- Run this in your Supabase SQL Editor to completely wipe a user and their dependencies

DO $$ 
DECLARE 
    v_user_email TEXT := 'kahsireddy3@gmail.com'; -- <--- CHANGE THIS EMAIL
    v_user_id UUID;
BEGIN
    -- 1. Get the User ID from profiles or auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users', v_user_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Found User ID: % for email: %', v_user_id, v_user_email;

    -- 2. Clear all dependent records in public schema
    
    -- Challenges & Risk
    DELETE FROM public.trade_consistency_snapshot WHERE user_id = v_user_id;
    DELETE FROM public.risk_violations WHERE user_id = v_user_id OR resolved_by = v_user_id;
    DELETE FROM public.daily_stats WHERE user_id = v_user_id;
    DELETE FROM public.trades WHERE user_id = v_user_id;
    DELETE FROM public.challenges_evaluation WHERE user_id = v_user_id;
    DELETE FROM public.challenges_rapid WHERE user_id = v_user_id;
    DELETE FROM public.challenges WHERE user_id = v_user_id;
    DELETE FROM public.passed_challenges WHERE user_id = v_user_id;
    
    -- Affiliate & Coupons
    DELETE FROM public.affiliate_earnings WHERE referrer_id = v_user_id OR referred_user_id = v_user_id;
    DELETE FROM public.affiliate_withdrawals WHERE user_id = v_user_id;
    DELETE FROM public.coupon_usage WHERE user_id = v_user_id;
    DELETE FROM public.coupon_redemptions WHERE user_id = v_user_id;
    DELETE FROM public.discount_coupons WHERE affiliate_id = v_user_id OR created_by = v_user_id;
    DELETE FROM public.coupons WHERE created_by = v_user_id;
    
    -- Payments & Requests
    DELETE FROM public.payment_orders WHERE user_id = v_user_id;
    DELETE FROM public.payout_requests WHERE user_id = v_user_id;
    DELETE FROM public.kyc_requests WHERE user_id = v_user_id OR approved_by = v_user_id;
    DELETE FROM public.bank_details WHERE user_id = v_user_id;
    DELETE FROM public.wallet_addresses WHERE user_id = v_user_id;
    
    -- General
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.certificates WHERE user_id = v_user_id;
    
    -- 3. Break Self-References in Profiles
    UPDATE public.profiles SET referred_by = NULL WHERE referred_by = v_user_id;

    -- 4. Delete the Profile
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- 5. Delete from Auth (Final Step)
    DELETE FROM auth.users WHERE id = v_user_id;

    RAISE NOTICE 'User % (ID: %) and all dependencies successfully deleted.', v_user_email, v_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during deletion: %', SQLERRM;
END $$;
