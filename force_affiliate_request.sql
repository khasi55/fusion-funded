-- MANUAL AFFILIATE REQUEST SQL SCRIPT
-- Run this in your Supabase SQL Editor if the "Apply" button is still giving an error.

DO $$ 
DECLARE 
    v_user_email TEXT := 'kahsireddy3@gmail.com'; -- <--- CHANGE THIS EMAIL
    v_user_id UUID;
BEGIN
    -- 1. Find the User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users', v_user_email;
        RETURN;
    END IF;

    -- 2. Force the status to 'pending' in the profiles table
    UPDATE public.profiles 
    SET 
        affiliate_status = 'pending',
        affiliate_request_date = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE 'User % has been successfully set to PENDING status.', v_user_email;
    RAISE NOTICE 'You should now see them in the Admin Portal under "Pending Requests".';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;
