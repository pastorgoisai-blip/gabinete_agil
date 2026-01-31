-- RLS Security: Cabinets Table
-- Objetivo: Restringir criação e edição de gabinetes conforme roles.

-- 1. Remove políticas antigas para evitar conflitos/duplicidade
DROP POLICY IF EXISTS "Users can view own cabinet" ON public.cabinets;
DROP POLICY IF EXISTS "Users can create cabinets" ON public.cabinets;
-- (Caso existam outras não listadas no schema, garantir limpeza)

-- 2. Habilita RLS (Garantia)
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: Usuários autenticados podem ver o gabinete ao qual pertencem
-- Usa a função auxiliar get_user_cabinet_id() já existente
CREATE POLICY "RLS_Cabinets_Select" ON public.cabinets
FOR SELECT USING (
  id = get_user_cabinet_id()
  OR 
  -- Permite que Super Admins vejam tudo (Opcional, mas útil para gestão)
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. INSERT: Bloqueia Front-end Público. Apenas SUPER ADMIN ou Service Role.
-- Verifica se o usuário tem role 'super_admin' na tabela profiles.
CREATE POLICY "RLS_Cabinets_Insert" ON public.cabinets
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 5. UPDATE: Apenas o Admin do Gabinete ou Super Admin
CREATE POLICY "RLS_Cabinets_Update" ON public.cabinets
FOR UPDATE USING (
  -- É Super Admin?
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  OR
  -- É Admin DESTE gabinete específico?
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND cabinet_id = public.cabinets.id 
      AND role = 'admin'
    )
  )
);

-- 6. DELETE: Apenas Super Admin (Por segurança)
CREATE POLICY "RLS_Cabinets_Delete" ON public.cabinets
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
