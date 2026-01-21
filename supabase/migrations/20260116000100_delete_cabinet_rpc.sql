-- Upgrade Foreign Keys to CASCADE
ALTER TABLE courses
DROP CONSTRAINT courses_organization_id_fkey,
ADD CONSTRAINT courses_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

ALTER TABLE profiles
DROP CONSTRAINT profiles_organization_id_fkey,
ADD CONSTRAINT profiles_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

-- Create RPC Function
CREATE OR REPLACE FUNCTION delete_cabinet_fully(target_cabinet_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- 1. Check if caller is super admin
  SELECT is_super_admin INTO is_admin FROM profiles WHERE id = auth.uid();
  
  IF is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can delete cabinets.';
  END IF;

  -- 2. Delete the organization (Cascade will handle children)
  DELETE FROM organizations WHERE id = target_cabinet_id;
END;
$$;
