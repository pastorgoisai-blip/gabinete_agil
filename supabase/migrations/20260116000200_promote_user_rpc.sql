-- Create Promote User RPC
CREATE OR REPLACE FUNCTION promote_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_id UUID := auth.uid();
  caller_is_super BOOLEAN;
  caller_role TEXT;
  caller_org UUID;
  target_org UUID;
BEGIN
  -- 1. Get Caller Info
  SELECT is_super_admin, role, organization_id 
  INTO caller_is_super, caller_role, caller_org 
  FROM profiles WHERE id = caller_id;

  -- 2. Get Target Info
  SELECT organization_id INTO target_org FROM profiles WHERE id = target_user_id;

  -- 3. Validation Logic
  IF caller_is_super THEN
    -- Super Admin can do anything
    NULL;
  ELSIF caller_role = 'admin' AND caller_org IS NOT NULL AND caller_org = target_org THEN
    -- Admin can promote within same org
    NULL;
  ELSE
    RAISE EXCEPTION 'Access Denied: You do not have permission to change roles for this user.';
  END IF;

  -- 4. Execute Update
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

-- Fix RLS Policy for Super Admins (using boolean column)
DROP POLICY IF EXISTS "Super Admin manage profiles" ON profiles;
CREATE POLICY "Super Admin manage profiles"
ON profiles
FOR ALL
USING (
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
);
