-- 1. Ensure 'status' column exists in profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Approve User Function
CREATE OR REPLACE FUNCTION approve_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executor is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can perform this action.';
  END IF;

  -- Update target user status
  UPDATE profiles
  SET status = 'active'
  WHERE id = target_user_id;
END;
$$;

-- 3. Change User Role Function
CREATE OR REPLACE FUNCTION change_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security Check
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can perform this action.';
  END IF;

  -- Validate Role
  IF new_role NOT IN ('super_admin', 'admin', 'staff', 'member') THEN
     RAISE EXCEPTION 'Invalid Role: %', new_role;
  END IF;

  -- Update Role
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

-- 4. Delete User Profile Function
CREATE OR REPLACE FUNCTION delete_user_profile(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security Check
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can perform this action.';
  END IF;

  -- Delete Profile (assuming Cascade will handle auth.users if linked via foreign key, 
  -- usually we only delete profile here. To delete from auth.users requires service_role key or separate edge function. 
  -- Since this is an RPC, it behaves within Postgres permissions. Deleting from public.profiles is safe.)
  DELETE FROM profiles
  WHERE id = target_user_id;
END;
$$;
