-- Relax constraint on offices type
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

-- Seed Data (Official Templates - Manual Presidência)
INSERT INTO doc_templates (title, type, content_html, cabinet_id) VALUES
(
  'Ofício de Gabinete', 
  'Ofício', 
  '<div style="font-family: ''Times New Roman'', serif; font-size: 12pt; color: #000; line-height: 1.5;">
    <!-- Topo Invisível para Alinhamento -->
    <table style="width: 100%; border: none; margin-bottom: 1cm;">
       <tr style="border: none;">
         <td style="width: 50%; border: none; vertical-align: top; padding: 0;">
            <p style="margin: 0; font-weight: bold;">Assunto: [ASSUNTO]</p>
            <p style="margin: 0;">Ref: [REFERÊNCIA/PROCESSO]</p>
         </td>
         <td style="width: 50%; border: none; vertical-align: top; text-align: right; padding: 0;">
            <p style="margin: 0;">Inovação, [DATA].</p>
            <p style="margin: 0; font-weight: bold;">Ofício nº ______/2026 - GAB</p>
         </td>
       </tr>
    </table>

    <p style="text-indent: 0; margin-bottom: 1cm;">
      Ao(À) Senhor(a)<br>
      <strong>[NOME DO DESTINATÁRIO]</strong><br>
      [CARGO]<br>
      [INSTITUIÇÃO]
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Excelentíssimo Senhor(a),
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Cumprimentando-o cordialmente, venho por meio deste informar que [TEXTO DO OFÍCIO...].
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Colocamo-nos à disposição para quaisquer esclarecimentos que se façam necessários.
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 1cm; text-align: justify;">
      Atenciosamente,
    </p>

    <!-- Assinatura Indivisível -->
    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 2cm; text-align: center;">
       <p style="margin-bottom: 0;">__________________________________________</p>
       <p style="font-weight: bold; margin: 0;">[NOME DO VEREADOR]</p>
       <p style="margin: 0;">Vereador(a) - Câmara Municipal</p>
    </div>
  </div>',
  NULL
),
(
  'Indicação', 
  'Indicação', 
  '<div style="font-family: ''Times New Roman'', serif; font-size: 12pt; color: #000; line-height: 1.5;">
    
    <div style="text-align: center; margin-bottom: 1.5cm;">
       <p style="font-weight: bold; font-size: 14pt; margin: 0;">INDICAÇÃO Nº ______/2026</p>
    </div>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Senhor Presidente,
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      <strong>INDICO</strong> à Mesa, ouvido o Soberano Plenário e dispensadas as formalidades regimentais, que seja enviado expediente ao Chefe do Poder Executivo, solicitando providências junto à Secretaria Competente para realizar <strong>[SOLICITAÇÃO]</strong> no endereço <strong>[ENDEREÇO/LOCAL]</strong>.
    </p>

    <h3 style="text-align: center; font-weight: bold; margin-top: 1.5cm; margin-bottom: 0.5cm; text-transform: uppercase;">JUSTIFICATIVA</h3>

    <div style="text-align: justify;">
       <p style="text-indent: 2.5cm; margin-bottom: 0.5cm;">
          A presente indicação justifica-se pelo fato de que a comunidade local vem sofrendo com [DESCREVER PROBLEMA].
       </p>
       <p style="text-indent: 2.5cm; margin-bottom: 0.5cm;">
          Tal medida trará benefícios diretos como [BENEFÍCIOS], atendendo aos anseios dos moradores da região.
       </p>
    </div>

    <!-- Assinatura -->
    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 2cm; text-align: center;">
       <p style="margin: 0;">Sala das Sessões, em [DATA].</p>
       <br><br>
       <p style="margin-bottom: 0;">__________________________________________</p>
       <p style="font-weight: bold; margin: 0;">[NOME DO VEREADOR]</p>
       <p style="margin: 0;">Vereador(a)</p>
    </div>
  </div>',
  NULL
),
(
  'Moção de Aplausos', 
  'Moção', 
  '<div style="font-family: ''Times New Roman'', serif; font-size: 12pt; color: #000; line-height: 1.5;">
    
    <h2 style="text-align: center; font-weight: bold; font-size: 16pt; margin-top: 1cm; margin-bottom: 1.5cm;">MOÇÃO DE APLAUSO</h2>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
       Senhor Presidente,
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
       A <strong>CÂMARA MUNICIPAL DE INOVAÇÃO</strong>, por iniciativa do Vereador <strong>[NOME DO VEREADOR]</strong>, manifesta seus mais efusivos votos de aplausos e congratulações a:
    </p>

    <p style="text-align: center; font-weight: bold; font-size: 14pt; margin: 1cm 0;">[NOME DO HOMENAGEADO]</p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
       Esta homenagem se deve aos relevantes serviços prestados à comunidade, notadamente [MOTIVO DA HOMENAGEM]. Sua dedicação e compromisso servem de exemplo para todos os cidadãos.
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
       Requer-se, após deliberação do Plenário, que seja dada ciência desta ao homenageado.
    </p>

    <!-- Assinatura -->
    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 2cm; text-align: center;">
       <p style="margin: 0;">Inovação, [DATA].</p>
       <br><br>
       <p style="margin-bottom: 0;">__________________________________________</p>
       <p style="font-weight: bold; margin: 0;">[NOME DO VEREADOR]</p>
       <p style="margin: 0;">Autor da Propositura</p>
    </div>
  </div>',
  NULL
),
(
  'Título de Cidadão', 
  'Título', 
  '<div style="border: 4px double #000; padding: 1cm; height: 100%; box-sizing: border-box; font-family: ''Times New Roman'', serif; color: #000; text-align: center;">
    
    <!-- Espaço para Brasão (gerido pelo Header do Editor ou Img fixa) -->
    <div style="height: 2cm;"></div> 

    <h1 style="font-size: 28pt; font-weight: bold; margin-top: 1cm; margin-bottom: 1cm; text-transform: uppercase;">Título de Cidadão</h1>
    
    <p style="font-size: 14pt; margin-bottom: 0.5cm;">A Câmara Municipal, no uso de suas atribuições legais, confere a</p>

    <h2 style="font-size: 36pt; font-weight: bold; margin: 1.5cm 0; font-family: ''Pinyon Script'', ''Edwardian Script ITC'', serif;">[NOME DO HOMENAGEADO]</h2>

    <p style="font-size: 16pt; margin-bottom: 1cm; line-height: 1.5; padding: 0 2cm;">
       O Título de Cidadão Honorário, em reconhecimento à sua inestimável contribuição para o desenvolvimento do nosso Município.
    </p>

    <div style="margin-top: 3cm; display: flex; justify-content: space-around;">
       <div>
          <p>__________________________</p>
          <p style="font-weight: bold;">Presidente da Câmara</p>
       </div>
       <div>
          <p>__________________________</p>
          <p style="font-weight: bold;">[Nome do Vereador]</p>
          <p>Autor</p>
       </div>
    </div>

    <p style="margin-top: 2cm; font-size: 10pt;">[DATA]</p>
  </div>',
  NULL
),
(
  'Ofício Comissão Especial', 
  'Ofício', 
  '<div style="font-family: ''Times New Roman'', serif; font-size: 12pt; color: #000; line-height: 1.5;">
    
    <div style="text-align: center; border-bottom: 1px solid #000; margin-bottom: 1cm; padding-bottom: 10px;">
       <p style="font-weight: bold; margin: 0;">COMISSÃO ESPECIAL DE PLANO DIRETOR</p>
       <p style="font-size: 10pt; margin: 0;">Resolução nº 001/2026</p>
    </div>

    <p style="text-align: right; margin-bottom: 1cm;">
      Ofício Circular nº ______/2026 - CEPD
    </p>

    <p style="margin-bottom: 1cm;">
       <strong>Ao Senhor(a) [NOME]</strong><br>
       [CARGO]
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Prezado(a) Senhor(a),
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Convoca Vossa Excelência para participar da <strong>AUDIÊNCIA PÚBLICA</strong> que discutirá as diretrizes do novo Plano Diretor, a realizar-se no dia [DATA], às [HORÁRIO], no Plenário desta Casa.
    </p>

    <p style="text-indent: 2.5cm; margin-bottom: 0.5cm; text-align: justify;">
      Sua presença é indispensável para o enriquecimento do debate democrático.
    </p>

    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 2cm; text-align: center;">
       <p style="margin-bottom: 0;">__________________________________________</p>
       <p style="font-weight: bold; margin: 0;">Presidente da Comissão Especial</p>
    </div>

    <div style="position: absolute; bottom: 0; left: 0; right: 0; font-size: 9pt; text-align: center; border-top: 1px solid #ccc; padding-top: 5px; color: #666;">
       <p>Comissão instituída pela Resolução nº 001/2026 - "Trabalhando pelo Futuro da Cidade"</p>
    </div>
  </div>',
  NULL
);
