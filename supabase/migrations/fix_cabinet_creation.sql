-- ⚠️ EXECUTE ESTE SCRIPT PARA CORRIGIR A CRIAÇÃO DE GABINETE ⚠️

-- O erro acontece porque, ao criar o gabinete, o usuário não conseguia ver o registro criado (pois ainda não estava vinculado a ele no perfil).
-- SOLUÇÃO: Adicionar o campo 'owner_id' ao gabinete para identificar o dono, permitindo que ele veja e edite o gabinete que acabou de criar.

-- 1. Adicionar coluna owner_id
ALTER TABLE public.cabinets 
ADD COLUMN IF NOT EXISTS owner_id UUID DEFAULT auth.uid();

-- 2. Atualizar Políticas de Cabinets
DROP POLICY IF EXISTS "Users can view own cabinet" ON public.cabinets;
DROP POLICY IF EXISTS "Users can create cabinets" ON public.cabinets;
DROP POLICY IF EXISTS "Platform Admins Update Cabinets" ON public.cabinets;

-- Permitir ver se: É membro (via perfil) OU É dono (via owner_id) OU É Super Admin
CREATE POLICY "Users can view own cabinet" ON public.cabinets
FOR SELECT USING (
  -- Membro do gabinete
  id = (SELECT cabinet_id FROM public.get_my_data())
  OR
  -- Dono do gabinete (quem criou)
  owner_id = auth.uid()
  OR
  -- Super Admin
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

-- Permitir INSERT para qualquer autenticado
CREATE POLICY "Users can create cabinets" ON public.cabinets
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Permitir UPDATE para Dono ou Super Admin
CREATE POLICY "Owners and Admins can update cabinets" ON public.cabinets
FOR UPDATE USING (
  owner_id = auth.uid()
  OR
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);

-- 3. Garantir Políticas de Profile (Reforço)
DROP POLICY IF EXISTS "See own profile or cabinet members" ON public.profiles;

CREATE POLICY "See own profile or cabinet members" ON public.profiles
FOR SELECT USING (
  id = auth.uid()
  OR
  cabinet_id = (SELECT cabinet_id FROM public.get_my_data())
  OR
  (SELECT is_admin FROM public.get_my_data()) = TRUE
);
