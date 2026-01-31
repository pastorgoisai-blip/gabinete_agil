-- Migração para Dashboard de Produtividade e Relatórios Reais

-- 1. Criar tabela de logs de acesso
CREATE TABLE IF NOT EXISTS public.system_access_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    cabinet_id uuid,
    accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT system_access_logs_pkey PRIMARY KEY (id),
    CONSTRAINT system_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT system_access_logs_cabinet_id_fkey FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id)
);

-- Habilitar RLS
ALTER TABLE public.system_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para system_access_logs
CREATE POLICY "Usuários podem inserir seus próprios logs"
    ON public.system_access_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios logs"
    ON public.system_access_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver logs do seu gabinete"
    ON public.system_access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
            AND profiles.cabinet_id = system_access_logs.cabinet_id
        )
    );

-- 2. Adicionar coluna created_by nas tabelas principais
-- Voters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'created_by') THEN
        ALTER TABLE public.voters ADD COLUMN created_by uuid REFERENCES public.profiles(id);
    END IF;
END $$;

-- Events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_by') THEN
        ALTER TABLE public.events ADD COLUMN created_by uuid REFERENCES public.profiles(id);
    END IF;
END $$;

-- Demands
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'created_by') THEN
        ALTER TABLE public.demands ADD COLUMN created_by uuid REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. Atualizar Políticas RLS existentes para permitir que created_by seja preenchido automaticamente (se necessário)
-- Geralmente o default RLS permite INSERT se autenticado, mas o backend/frontend deve enviar o ID.
-- Vamos garantir que os novos campos sejam acessíveis.

COMMENT ON TABLE public.system_access_logs IS 'Logs de acesso ao sistema para métricas de produtividade';
COMMENT ON COLUMN public.voters.created_by IS 'Usuário que criou o registro';
