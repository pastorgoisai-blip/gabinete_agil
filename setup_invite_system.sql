-- 1. Create Invitations Table
CREATE TABLE IF NOT EXISTS cabinet_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '48 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' -- 'pending', 'accepted', 'expired'
);

-- 2. RLS Policies
ALTER TABLE cabinet_invites ENABLE ROW LEVEL SECURITY;

-- Policy: View invites (Admins of the same cabinet)
CREATE POLICY "View invites for own cabinet" ON cabinet_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.cabinet_id = cabinet_invites.cabinet_id
            AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
        )
    );

-- Policy: Create invites (Admins/Super Admins)
-- Note: We generally handle this via RPC for stricter control, but this policy is good for direct inserts if needed.
CREATE POLICY "Create invites" ON cabinet_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.cabinet_id = cabinet_invites.cabinet_id
            AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
        )
    );

-- Policy: Delete/Revoke invites
CREATE POLICY "Manage invites" ON cabinet_invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.cabinet_id = cabinet_invites.cabinet_id
            AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
        )
    );

-- 3. RPC: Create Invite
CREATE OR REPLACE FUNCTION create_invite_token(target_email TEXT, target_role TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_cabinet_id UUID;
    new_token UUID;
    is_admin BOOLEAN;
BEGIN
    -- Get current user's cabinet and role
    SELECT cabinet_id, (role = 'admin' OR is_super_admin) INTO current_cabinet_id, is_admin
    FROM profiles
    WHERE id = auth.uid();

    IF current_cabinet_id IS NULL OR is_admin IS FALSE THEN
        RAISE EXCEPTION 'Permission denied: You must be an admin of a cabinet to invite users.';
    END IF;

    -- Generate Token
    new_token := gen_random_uuid();

    -- Insert Invite
    INSERT INTO cabinet_invites (cabinet_id, email, role, token, created_by)
    VALUES (current_cabinet_id, target_email, target_role, new_token, auth.uid());

    RETURN new_token;
END;
$$;

-- 4. RPC: Validate Token (Public access for invite page)
CREATE OR REPLACE FUNCTION validate_invite_token(token_uuid UUID)
RETURNS TABLE (
    valid BOOLEAN,
    email TEXT,
    cabinet_name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (i.expires_at > now() AND i.status = 'pending'),
        i.email,
        c.name,
        i.role
    FROM cabinet_invites i
    JOIN cabinets c ON i.cabinet_id = c.id
    WHERE i.token = token_uuid;
END;
$$;

-- 5. Trigger: Accept Invite on User Creation (Robust & Safe)
-- This function runs BEFORE a profile is inserted.
-- It attempts to fetch the email from auth.users to find proper invite.
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
    RAISE WARNING 'Invite trigger failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_profile_created_check_invite ON profiles;

-- Create New BEFORE Trigger
CREATE TRIGGER on_profile_before_insert_check_invite
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_invite_match_v2();
