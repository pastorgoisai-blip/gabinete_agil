-- Adiciona colunas novas à tabela events se não existirem
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS notify_politician BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS notify_media BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS notify_staff BOOLEAN DEFAULT FALSE;

-- Correção: Adicionando coluna source faltante
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app';
