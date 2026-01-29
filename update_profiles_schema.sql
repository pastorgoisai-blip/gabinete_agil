-- update_profiles_schema.sql

-- 1. Adicionar colunas ao perfil
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'permissions') THEN
        ALTER TABLE public.profiles ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- 2. Configurar Storage para Avatares
-- Inserir bucket se não existir (O SQL do Supabase para criar bucket geralmente é via API, mas podemos tentar via injeção em storage.buckets se tiver permissão, ou apenas instruir o usuário)
-- Tentativa de criação via SQL (pode falhar dependendo das permissões do postgres role, mas vale a tentativa se for self-hosted ou permissivo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para Avatares
-- Permitir acesso público para ver avatares
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Permitir upload autenticado
CREATE POLICY "Avatar Upload Auth"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Permitir update do próprio avatar (pasta nomeada pelo user_id seria ideal, mas aqui vamos simples)
CREATE POLICY "Avatar Update Own"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Permitir delete do próprio avatar
CREATE POLICY "Avatar Delete Own"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
