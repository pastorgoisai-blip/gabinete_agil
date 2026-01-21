-- Infraestrutura Super Admin

-- 1. Adicionar flag na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Criar função segura (RPC) para verificar se é super admin
-- Útil para chamar do frontend via supabase.rpc('is_user_super_admin')
CREATE OR REPLACE FUNCTION public.is_user_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT is_super_admin INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário: A função é SECURITY DEFINER para garantir que leia a tabela profiles
-- mesmo que o RLS restrinja algo, mas como ela filtra por auth.uid(), é segura.
