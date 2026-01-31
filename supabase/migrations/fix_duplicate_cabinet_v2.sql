-- 1. Ensure UNIQUE constraint on cabinet names
-- We use a unique index with lower(name) to prevent "Cabinet A" and "cabinet a"
CREATE UNIQUE INDEX IF NOT EXISTS cabinets_name_key ON public.cabinets (lower(name));

-- 2. Drop the old function signature first to avoid ambiguity
DROP FUNCTION IF EXISTS public.join_cabinet_by_name(text);

-- 3. Create RPC function to join a cabinet by name (With Profile Creation)
CREATE OR REPLACE FUNCTION public.join_cabinet_by_name(
    cabinet_name TEXT, 
    user_name TEXT, 
    user_email TEXT
)
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

  -- Upsert user profile (Insert if new, Update if exists)
  INSERT INTO public.profiles (id, cabinet_id, name, email, role, status)
  VALUES (user_id, target_cabinet_id, user_name, user_email, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE
  SET 
    cabinet_id = target_cabinet_id,
    status = 'active';

  RETURN jsonb_build_object('success', true, 'cabinet_id', target_cabinet_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Erro interno ao vincular gabinete: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
