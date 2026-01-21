-- Add columns to offices
ALTER TABLE offices ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS content_html text;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS content_json jsonb;

-- Create doc_templates table
CREATE TABLE IF NOT EXISTS doc_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  default_content_html text,
  cabinet_id uuid REFERENCES cabinets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS for doc_templates
ALTER TABLE doc_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to global templates (cabinet_id IS NULL) and specific cabinet templates
CREATE POLICY "Templates viewable by authenticated users" 
  ON doc_templates FOR SELECT 
  TO authenticated 
  USING (
    cabinet_id IS NULL OR 
    cabinet_id = (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
  );

-- Insert default templates
INSERT INTO doc_templates (name, type, default_content_html) VALUES
('Ofício Padrão', 'Ofício', '<p><strong>Assunto:</strong> [Insira o Assunto]</p><p>Prezado(a) Senhor(a),</p><p>Venho por meio deste solicitar...</p><p>Atenciosamente,</p>'),
('Requerimento de Informação', 'Requerimento', '<h3>REQUERIMENTO Nº ____/2026</h3><p><strong>Ementa:</strong> Requer informações sobre...</p><p>Senhor Presidente,</p><p>Requeiro à Mesa, ouvido o Soberano Plenário...</p>'),
('Moção de Aplausos', 'Moção', '<h3>MOÇÃO DE APLAUSOS</h3><p>A Câmara Municipal manifesta seus aplausos a...</p>'),
('Indicação de Zeladoria', 'Indicação', '<h3>INDICAÇÃO</h3><p>Indico ao Chefe do Poder Executivo que determine ao setor competente a realização de...</p>');
