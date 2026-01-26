-- 1. Limpar tabela de templates (Remover duplicatas)
DELETE FROM public.doc_templates;

-- 2. Inserir Templates Corretos mapeados para o bucket 'templates'
-- Baseado na imagem fornecida pelo usuário
INSERT INTO public.doc_templates (title, type, storage_path, cabinet_id) VALUES
(
    'Ofício de Gabinete', 
    'Ofício', 
    'template_oficio_de_gabinete.docx', 
    NULL -- Global
),
(
    'Ofício Comissão Especial', 
    'Ofício', 
    'template_oficio_comissao_especial.docx', 
    NULL -- Global
),
(
    'Indicação Legislativa', 
    'Indicação', 
    'template_indicacao.docx', 
    NULL -- Global
),
(
    'Moção de Aplausos', 
    'Moção', 
    'template_mocao_de_aplausos.docx', 
    NULL -- Global
),
(
    'Título de Cidadão', 
    'Título', 
    'template_titulo_de_cidadao.docx', 
    NULL -- Global
);

-- Nota: Certifique-se que o bucket 'templates' é PÚBLICO ou que a policy de leitura permite acesso Authenticated.
-- Como estamos usando Service Role na Edge Function, o RLS do bucket não deve impedir o download, desde que o nome do arquivo esteja exato.
