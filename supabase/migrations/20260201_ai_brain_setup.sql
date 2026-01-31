-- Migration: 20260201_ai_brain_setup
-- Description: Adds system_prompt to agent_configurations and creates simulation_messages table

-- 1. Add system_prompt to agent_configurations
ALTER TABLE agent_configurations
ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT 'Você é um assistente virtual do gabinete do Vereador {{politician_name}}. Seu tom é {{tone}}. Hoje é {{current_date}}. Responda de forma curta e objetiva. Se não souber, diga que vai verificar com a equipe.';

COMMENT ON COLUMN agent_configurations.system_prompt IS 'Custom instructions for the AI Agent (System Prompt)';

-- 2. Create simulation_messages table for testing
CREATE TABLE IF NOT EXISTS simulation_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id uuid REFERENCES cabinets(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS Policies for simulation_messages
ALTER TABLE simulation_messages ENABLE ROW LEVEL SECURITY;

-- Allow cabinet owners to view their simulation messages
CREATE POLICY "Owners can view their simulation messages"
ON simulation_messages FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM profiles WHERE cabinet_id = simulation_messages.cabinet_id
));

-- Allow cabinet owners to insert simulation messages (via frontend simulator)
CREATE POLICY "Owners can create simulation messages"
ON simulation_messages FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE cabinet_id = simulation_messages.cabinet_id
));

-- Allow cabinet owners to delete (reset) their simulation
CREATE POLICY "Owners can reset simulation"
ON simulation_messages FOR DELETE
USING (auth.uid() IN (
    SELECT id FROM profiles WHERE cabinet_id = simulation_messages.cabinet_id
));

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_simulation_messages_cabinet_created
ON simulation_messages(cabinet_id, created_at);
