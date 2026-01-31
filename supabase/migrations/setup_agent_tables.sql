-- SCHEMA DO AGENTE 24H (Para rodar no Supabase > SQL Editor)

-- 1. Tabela de Configuração Geral do Agente
CREATE TABLE IF NOT EXISTS public.agent_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE CASCADE NOT NULL,
    agent_name TEXT DEFAULT 'Assistente Virtual',
    tone TEXT DEFAULT 'Empático e Acolhedor', -- 'Formal', 'Energético', etc.
    welcome_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cabinet_id) -- Apenas uma configuração por gabinete
);

-- 2. Tabela de Canais (Integrações)
CREATE TABLE IF NOT EXISTS public.agent_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'telegram'
    name TEXT, -- Nome para exibição (ex: WhatsApp Principal)
    status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    credentials JSONB DEFAULT '{}'::jsonb, -- Armazena metadados (NÃO senhas reais se possível, apenas identifiers)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Regras e Gatilhos
CREATE TABLE IF NOT EXISTS public.agent_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE CASCADE NOT NULL,
    keywords TEXT[] NOT NULL, -- Lista de palavras-chave
    action_type TEXT DEFAULT 'text_response', -- 'text_response', 'human_handoff', 'register_demand'
    response_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Conversas (Sessões)
CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE CASCADE NOT NULL,
    external_id TEXT NOT NULL, -- ID do usuário na plataforma externa (ex: telefone, IG handle)
    platform TEXT NOT NULL, -- 'whatsapp', 'instagram'
    user_name TEXT, 
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'human_needed'
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}' -- Tags como 'Educação', 'Resolvido'
);

-- 5. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL, -- 'user', 'agent', 'system'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb -- Para anexos, status de envio, etc.
);

-- --- RLS (Row Level Security) ---
-- Habilitar RLS
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Políticas (Usando a função get_user_cabinet_id() que já criamos antes)

-- Configurações
CREATE POLICY "Tenant Isolation: Agent Config" ON public.agent_configurations
    FOR ALL USING (cabinet_id = public.get_user_cabinet_id());

-- Canais
CREATE POLICY "Tenant Isolation: Agent Channels" ON public.agent_channels
    FOR ALL USING (cabinet_id = public.get_user_cabinet_id());

-- Regras
CREATE POLICY "Tenant Isolation: Agent Rules" ON public.agent_rules
    FOR ALL USING (cabinet_id = public.get_user_cabinet_id());

-- Conversas
CREATE POLICY "Tenant Isolation: Agent Conversations" ON public.agent_conversations
    FOR ALL USING (cabinet_id = public.get_user_cabinet_id());

-- Mensagens
-- Precisamos de um JOIN para verificar o cabinet_id via conversation_id, 
-- MAS policies com JOINS complexos podem ser lentas.
-- Melhor abordagem para performance: Adicionar cabinet_id em messages OU confiar na segurança da conversation.
-- Vamos fazer o check via conversation:
CREATE POLICY "Tenant Isolation: Agent Messages" ON public.agent_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agent_conversations c
            WHERE c.id = agent_messages.conversation_id
            AND c.cabinet_id = public.get_user_cabinet_id()
        )
    );
    
-- Para permitir INSERTS de mensagens (pelo backend/API), a role 'service_role' (usada pelo Edge Function) 
-- sempre tem bypass de RLS. Para usuários normais (dashboard), a policy acima cobre leitura.
