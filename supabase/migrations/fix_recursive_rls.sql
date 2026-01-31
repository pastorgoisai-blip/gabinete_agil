-- ⚠️ EXECUTE ESTE SCRIPT PARA CORRIGIR O ERRO 500 (LOOP INFINITO) ⚠️

-- O problema: As políticas anteriores tentavam ler a tabela 'profiles' para validar o acesso à própria tabela 'profiles',
-- criando um ciclo infinito que derruba o banco.

-- 1. Função Segura para ler dados do usuário (Bypass RLS)
-- 'SECURITY DEFINER' faz a função rodar com permissão de superusuário, ignorando as policies,
-- o que é seguro aqui pois apenas retornamos dados do PRÓPRIO usuário logado.

CREATE OR REPLACE FUNCTION public.get_my_data()
RETURNS TABLE (cabinet_id uuid, is_admin boolean) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT p.cabinet_id, p.is_platform_admin 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 2. Resetar Policies de Cabinets
DROP POLICY IF EXISTS "Users can view own cabinet" ON public.cabinets;
DROP POLICY IF EXISTS "Users can create cabinets" ON public.cabinets;
DROP POLICY IF EXISTS "Platform Admins can view all cabinets" ON public.cabinets;
DROP POLICY IF EXISTS "Platform Admins can update all cabinets" ON public.cabinets;

-- Nova Policy Otimizada
CREATE POLICY "Users can view own cabinet" ON public.cabinets
FOR SELECT USING (
  id = (SELECT cabinet_id FROM public.get_my_data())
  OR
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

CREATE POLICY "Users can create cabinets" ON public.cabinets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Platform Admins Update Cabinets" ON public.cabinets
FOR UPDATE USING (
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

-- 3. Resetar Policies de Profiles
DROP POLICY IF EXISTS "Users can view profiles from same cabinet" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Platform Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Platform Admins can update all profiles" ON public.profiles;

-- Nova Policy Otimizada
CREATE POLICY "See own profile or cabinet members" ON public.profiles
FOR SELECT USING (
  -- Vê a si mesmo
  id = auth.uid()
  OR
  -- Vê membros do mesmo gabinete (sem ler a propria tabela profiles recursivamente na clausula)
  cabinet_id = (SELECT cabinet_id FROM public.get_my_data())
  OR
  -- Super Admin vê tudo
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

CREATE POLICY "Update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Platform Admins Update Profiles" ON public.profiles
FOR UPDATE USING (
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

-- 4. Garantir Trigger de Criação de Usuário Funcionando
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status, is_platform_admin)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email, 
    'staff', 
    'active',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger apenas se não existir (Drop e Create garante versão nova)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Se o seu usuário 'pr.onerson@gmail.com' já estiver travado no Auth sem Profile:
-- Esta parte tenta consertar usuários orfãos
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT * FROM auth.users LOOP
    INSERT INTO public.profiles (id, name, email, role, status, is_platform_admin)
    VALUES (
      u.id,
      COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
      u.email,
      'staff',
      'active',
      FALSE
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;
