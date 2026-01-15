-- ⚠️ EXECUTE ESTE SCRIPT NO "SQL EDITOR" DO SUPABASE ⚠️

-- 1. Habilitar a extensão pgcrypto (geralmente já vem, mas garante UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Corrigir Políticas de GABINETES (Cabinets)
-- Removemos as antigas para evitar duplicidade/conflito
DROP POLICY IF EXISTS "Users can view own cabinet" ON public.cabinets;
DROP POLICY IF EXISTS "Users can create cabinets" ON public.cabinets;

-- Permite ver o gabinete se você for o dono dele (via perfil)
CREATE POLICY "Users can view own cabinet" ON public.cabinets
FOR SELECT USING (
  id IN (
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Permite CRIAR gabinete se você estiver logado (Essencial para Onboarding)
CREATE POLICY "Users can create cabinets" ON public.cabinets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Corrigir Políticas de PERFIS (Profiles)
DROP POLICY IF EXISTS "Users can view profiles from same cabinet" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Permite ver perfil se for do mesmo gabinete OU se for o seu próprio
CREATE POLICY "Users can view profiles from same cabinet" ON public.profiles
FOR SELECT USING (
  (cabinet_id IN (
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
  )) 
  OR 
  (id = auth.uid())
);

-- Permite atualizar o próprio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- Permite CRIAR o próprio perfil (Essencial para Signup/Login inicial)
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. AUTOMAÇÃO: Gatilho para criar Perfil ao se Cadastrar (Signup)
-- Isso resolve o problema de usuários "sem perfil" ao criar conta.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'Novo Usuário'), 
    new.email, 
    'staff', 
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- Evita erro se já existir
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Removemos trigger antigo se existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Extra: Políticas para Legislative Matters (Garante que funcione também)
ALTER TABLE public.legislative_matters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cabinet legislative matters" ON public.legislative_matters;
CREATE POLICY "Users can view own cabinet legislative matters" ON public.legislative_matters
FOR SELECT USING (cabinet_id IN (
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
));

DROP POLICY IF EXISTS "Users can create legislative matters" ON public.legislative_matters;
CREATE POLICY "Users can create legislative matters" ON public.legislative_matters
FOR INSERT WITH CHECK (cabinet_id IN (
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
));
