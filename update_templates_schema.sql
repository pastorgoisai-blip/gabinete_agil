-- Relax constraint on offices type if any (usually text types are permissive by default in Postgres unless a domain/enum is used)
-- We'll just ensure it's text.
ALTER TABLE offices ALTER COLUMN type TYPE text;

-- Recreate doc_templates table
DROP TABLE IF EXISTS doc_templates CASCADE;

CREATE TABLE doc_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL,
  content_html text,
  cabinet_id uuid REFERENCES cabinets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE doc_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by authenticated users" 
  ON doc_templates FOR SELECT 
  TO authenticated 
  USING (
    cabinet_id IS NULL OR 
    cabinet_id = (SELECT cabinet_id FROM profiles WHERE id = auth.uid())
  );

-- Seed Data (Professional Templates)
INSERT INTO doc_templates (title, type, content_html, cabinet_id) VALUES
(
  'Indicação', 
  'Indicação', 
  '<div class="a4-page" style="padding: 3cm 2cm 2cm 3cm; font-family: ''Times New Roman'', Times, serif; font-size: 12pt; line-height: 1.5;">
    <div style="text-align: center; margin-bottom: 2cm;">
       <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" alt="Brasão" style="width: 80px; height: auto;">
       <p style="font-weight: bold; margin-top: 10px; text-transform: uppercase;">Câmara Municipal de Inovação</p>
       <p style="font-size: 10pt;">Estado de Goiás</p>
    </div>
    <div style="margin-bottom: 2cm;">
       <p style="font-weight: bold;">INDICAÇÃO Nº ______/2026</p>
       <p style="text-align: justify; margin-left: 8cm;">
         Indica ao Chefe do Poder Executivo a necessidade de realizar [Descreva a ação] no bairro [Nome do Bairro].
       </p>
    </div>
    <p>Senhor Presidente,</p>
    <p style="text-align: justify; text-indent: 2cm;">
      Indico à Mesa, ouvido o Soberano Plenário, e dispensadas as formalidades regimentais, que seja enviado ofício ao Senhor Prefeito Municipal, solicitando que determine ao setor competente a realização de <strong>[SOLICITAÇÃO AQUI]</strong>.
    </p>
    <p style="text-align: justify; text-indent: 2cm; margin-top: 1cm;">
      <strong>JUSTIFICATIVA:</strong><br>
      A presente solicitação se faz necessária tendo em vista que [INSIRA SUA JUSTIFICATIVA AQUI].
    </p>
    <div style="margin-top: 4cm; text-align: center;">
       <p>Sala das Sessões, em [DATA].</p>
       <br><br>
       <p>____________________________________</p>
       <p><strong>[NOME DO VEREADOR]</strong><br>Vereador(a)</p>
    </div>
  </div>',
  NULL
),
(
  'Moção de Aplausos', 
  'Moção', 
  '<div class="a4-page" style="padding: 3cm 2cm 2cm 3cm; font-family: ''Times New Roman'', Times, serif; font-size: 12pt; line-height: 1.5;">
    <div style="text-align: center; margin-bottom: 2cm;">
       <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" alt="Brasão" style="width: 80px; height: auto;">
       <p style="font-weight: bold; margin-top: 10px; text-transform: uppercase;">Câmara Municipal de Inovação</p>
    </div>
    <div style="margin-bottom: 1cm;">
       <p style="font-weight: bold;">MOÇÃO DE APLAUSOS Nº ______/2026</p>
       <p style="text-align: justify; margin-left: 8cm;">
         Manifesta votos de aplausos e congratulações a [NOME DO HOMENAGEADO] pelos relevantes serviços prestados...
       </p>
    </div>
    <p>Senhor Presidente,</p>
    <p style="text-align: justify; text-indent: 2cm;">
       A Câmara Municipal de Inovação, legítima representante do povo, manifesta seus mais sinceros <strong>APLAUSOS</strong> a <strong>[NOME]</strong>, em virtude de [MOTIVO].
    </p>
    <p style="text-align: justify; text-indent: 2cm;">
       Que do deliberado seja dada ciência ao homenageado.
    </p>
    <div style="margin-top: 4cm; text-align: center;">
       <p>Sala das Sessões, em [DATA].</p>
       <br><br>
       <p>____________________________________</p>
       <p><strong>[NOME DO VEREADOR]</strong><br>Vereador(a)</p>
    </div>
  </div>',
  NULL
),
(
  'Ofício de Gabinete', 
  'Ofício', 
  '<div class="a4-page" style="padding: 3cm 2cm 2cm 3cm; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
    <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 1cm;">
       <div style="display: flex; align-items: center; justify-content: space-between;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" style="width: 60px;">
          <div style="text-align: right;">
             <p style="font-weight: bold; margin: 0;">GABINETE DO VEREADOR [NOME]</p>
             <p style="font-size: 9pt; margin: 0;">Câmara Municipal de Inovação</p>
          </div>
       </div>
    </div>
    <p style="text-align: right;">Inovação, [DATA].</p>
    <p><strong>Ofício nº _____/2026 - GAB</strong></p>
    <br>
    <p>Ao(À) Senhor(a)<br><strong>[NOME DESTINATÁRIO]</strong><br>[CARGO]</p>
    <br>
    <p><strong>Assunto: [ASSUNTO]</strong></p>
    <br>
    <p>Prezado(a) Senhor(a),</p>
    <p style="text-align: justify; text-indent: 1cm;">
      Cumprimentando-o(a) cordialmente, venho por meio deste solicitar [SOLICITAÇÃO].
    </p>
    <br>
    <p>Certos de contar com vossa atenção, renovo protestos de estima e consideração.</p>
    <br>
    <p>Atenciosamente,</p>
    <br><br>
    <p>____________________________________</p>
    <p><strong>[NOME DO VEREADOR]</strong><br>Vereador(a)</p>
  </div>',
  NULL
),
(
  'Ofício Comissão Especial', 
  'Ofício', 
  '<div class="a4-page" style="padding: 3cm 2cm 2cm 3cm; font-family: ''Times New Roman'', Times, serif; font-size: 12pt;">
    <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
       <p style="font-weight: bold;">COMISSÃO ESPECIAL DE RELATÓRIO DO PLANO DIRETOR</p>
       <p style="font-size: 10pt;">Câmara Municipal de Inovação</p>
    </div>
    <p style="text-align: right;">Ofício Circular nº ____/2026</p>
    <p><strong>Inovação, [DATA]</strong></p>
    <br>
    <p><strong>A Vossa Senhoria<br>[NOME]<br>[CARGO]</strong></p>
    <br>
    <p>Senhor(a),</p>
    <p style="text-align: justify; text-indent: 1.5cm;">
      Convocamos Vossa Senhoria para participar da Audiência Pública sobre o Plano Diretor, a realizar-se no dia [DATA], às [HORA].
    </p>
    <br><br>
    <p style="text-align: center;">Respeitosamente,</p>
    <br><br>
    <p style="text-align: center;">____________________________________<br><strong>Presidência da Comissão</strong></p>
  </div>',
  NULL
),
(
  'Título de Cidadão', 
  'Título', 
  '<div class="a4-page" style="padding: 2cm; border: 5px double #000; height: 100%; text-align: center; font-family: ''Old English Text MT'', serif;">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png" style="width: 100px; margin-bottom: 1cm;">
    <h1 style="font-size: 24pt;">Título de Cidadão Anapolino</h1>
    <br><br>
    <p style="font-family: ''Times New Roman'', serif; font-size: 16pt;">A Câmara Municipal de Inovação</p>
    <p style="font-family: ''Times New Roman'', serif; font-size: 14pt;">No uso de suas atribuições legais, confere a</p>
    <br>
    <h2 style="font-size: 36pt;">[NOME DO HOMENAGEADO]</h2>
    <br>
    <p style="font-family: ''Times New Roman'', serif; font-size: 14pt; max-width: 80%; margin: 0 auto;">
       O Título de Cidadão Anapolino, em reconhecimento aos relevantes serviços prestados à nossa comunidade.
    </p>
    <br><br><br>
    <div style="display: flex; justify-content: space-around; font-family: ''Times New Roman'', serif; font-size: 12pt;">
       <div>
          <p>_______________________</p>
          <p>Presidente da Câmara</p>
       </div>
       <div>
          <p>_______________________</p>
          <p>Autor da Propositura</p>
       </div>
    </div>
    <p style="margin-top: 2cm; font-family: Arial, sans-serif; font-size: 10pt;">[DATA]</p>
  </div>',
  NULL
);
