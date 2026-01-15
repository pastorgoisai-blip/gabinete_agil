-- 1. Ensure UNIQUE constraint on cabinet names (case insensitive if possible, but standard unique first)
-- We use a unique index with lower(name) to prevent "Cabinet A" and "cabinet a"
CREATE UNIQUE INDEX IF NOT EXISTS cabinets_name_key ON public.cabinets (lower(name));

-- 2. Create RPC function to join a cabinet by name
CREATE OR REPLACE FUNCTION public.join_cabinet_by_name(cabinet_name TEXT)
RETURNS JSONB AS $$
DECLARE
  target_cabinet_id UUID;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- Find cabinet ID (case insensitive search)
  SELECT id INTO target_cabinet_id
  FROM public.cabinets
  WHERE lower(name) = lower(cabinet_name)
  LIMIT 1;

  IF target_cabinet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Gabinete não encontrado.');
  END IF;

  -- Update user profile
  UPDATE public.profiles
  SET 
    cabinet_id = target_cabinet_id,
    -- Reset role to staff/member initially, can be changed by admin later if needed
    -- For now we keep it as is or set a default. Let's assume joining grants 'staff' or keeps existing if any.
    role = COALESCE(role, 'staff'), 
    status = 'active'
  WHERE id = user_id;

  -- Verify update
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'cabinet_id', target_cabinet_id);
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao atualizar perfil.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
