-- FIX: Handle Invite Acceptance (Robust Version)
-- run this in Supabase SQL Editor

-- 1. Drop old triggers/functions to clean up
DROP TRIGGER IF EXISTS on_profile_created_check_invite ON profiles;
DROP FUNCTION IF EXISTS handle_invite_acceptance();

-- 2. Create improved function
CREATE OR REPLACE FUNCTION handle_invite_match_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions -- Best practice for Security Definer
AS $$
DECLARE
    fetched_email TEXT;
    invite_record RECORD;
BEGIN
    -- 1. Attempt to get email from auth.users using the new profile ID
    SELECT email INTO fetched_email
    FROM auth.users
    WHERE id = NEW.id;

    -- If not found (rare), try to see if NEW record has email column
    IF fetched_email IS NULL THEN
        BEGIN
            fetched_email := NEW.email;
        EXCEPTION WHEN OTHERS THEN
            fetched_email := NULL;
        END;
    END IF;

    -- If still no email, we can't match invites. Exit gracefully.
    IF fetched_email IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Find pending invite for this email
    SELECT * INTO invite_record
    FROM public.cabinet_invites
    WHERE email = fetched_email
    AND status = 'pending'
    AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF invite_record IS NOT NULL THEN
        -- 3. Set Profile fields (BEFORE INSERT allows modifying NEW directly)
        NEW.cabinet_id := invite_record.cabinet_id;
        -- Ensure role is valid or fallback to staff
        NEW.role := COALESCE(invite_record.role, 'staff'); 
        NEW.status := 'active';

        -- 4. Mark invite as accepted (Side effect is allowed)
        UPDATE public.cabinet_invites
        SET status = 'accepted'
        WHERE id = invite_record.id;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Safety net: If anything crashes, log it but ALLOW the user creation.
    -- This prevents "Database error saving new user" blockers.
    RAISE WARNING 'Invite trigger failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Attach new PRE-INSERT trigger
CREATE TRIGGER on_profile_before_insert_check_invite
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_invite_match_v2();
