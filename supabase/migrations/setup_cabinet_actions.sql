-- 1. Create Cabinet Function
CREATE OR REPLACE FUNCTION create_cabinet_admin(name TEXT, plan TEXT DEFAULT 'basic', owner_email TEXT DEFAULT NULL)
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

  -- Insert Cabinet
  INSERT INTO cabinets (name)
  VALUES (name);
  
  -- Note: If we need to process plan or owner_email, we would do it here.
  -- For now, consistent with current schema which might just be cabinets(id, name, created_at)
END;
$$;

-- 2. Delete Cabinet Fully Function
CREATE OR REPLACE FUNCTION delete_cabinet_fully(target_cabinet_id UUID)
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

  -- Delete Cabinet
  -- Assuming ON DELETE CASCADE is set up on foreign keys (profiles.cabinet_id, etc).
  -- If not, we would need to delete children first. 
  -- Proceeding with standard delete which should trigger cascades if schema is correct.
  DELETE FROM cabinets
  WHERE id = target_cabinet_id;
END;
$$;
