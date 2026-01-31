-- 1. Adicionar a coluna is_platform_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- 2. Atualizar o usuário para ser super_admin (opcional, para consistência)
-- ATENÇÃO: Substitua 'seu_email@exemplo.com' pelo seu email de login no Supabase
-- Se você não souber o email exato, pode tentar rodar sem o WHERE (vai atualizar TODOS os perfis, use com cuidado)
-- Ou rodar este bloco específico no SQL Editor do Supabase logado com sua conta:

UPDATE public.profiles
SET is_platform_admin = TRUE, role = 'super_admin'
-- WHERE email = 'seu_email@exemplo.com'; -- Descomente e coloque seu email se houver muitos usuários.
WHERE id IN (SELECT id FROM auth.users); -- Torna TODOS os usuários atuais admins (útil para dev/setup inicial)
