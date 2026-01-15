-- ⚠️ EXECUTE ESTE SCRIPT NO "SQL EDITOR" DO SUPABASE ⚠️

-- 1. Adicionar colunas de Controle Administrativo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- 2. Políticas de "GOD MODE" (Super Admin vê tudo)

-- Tabela: Cabinets
CREATE POLICY "Platform Admins can view all cabinets" ON public.cabinets
FOR SELECT USING (
  (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Platform Admins can update all cabinets" ON public.cabinets
FOR UPDATE USING (
  (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Tabela: Profiles
CREATE POLICY "Platform Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Platform Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- 3. Função para PROMOVER usuário a Super Admin (Facilita sua vida)
CREATE OR REPLACE FUNCTION public.make_me_admin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_found BOOLEAN;
BEGIN
  -- Verifica se o perfil existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = target_email) INTO user_found;
  
  IF user_found THEN
    UPDATE public.profiles
    SET is_platform_admin = TRUE, role = 'super_admin', status = 'active'
    WHERE email = target_email;
    RETURN 'Sucesso! Usuário ' || target_email || ' agora é Super Admin Global.';
  ELSE
    RETURN 'Erro: Usuário com email ' || target_email || ' não encontrado na tabela profiles. Ele fez login pelo menos uma vez?';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Correção de Emergência para "Email não confirmado"
-- Se o usuário existir no Auth mas não no Profiles (preso no limbo), forçamos a inserção.
-- NOTA: Isso requer privilégios elevados que o SQL Editor geralmente tem.

CREATE OR REPLACE FUNCTION public.force_create_admin_profile(target_id UUID, target_email TEXT, target_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, cabinet_id, name, email, role, status, is_platform_admin)
  VALUES (
    target_id, 
    NULL, -- Sem gabinete ainda
    target_name, 
    target_email, 
    'super_admin', 
    'active',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET is_platform_admin = TRUE, status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
