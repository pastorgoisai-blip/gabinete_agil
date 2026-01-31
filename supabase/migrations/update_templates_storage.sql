-- Adiciona coluna storage_path na tabela doc_templates
ALTER TABLE public.doc_templates 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- (Opcional) Atualiza um template existente com um caminho de teste se você tiver um arquivo 'modelo_teste.docx' no bucket 'documents'
-- UPDATE public.doc_templates SET storage_path = 'modelo_teste.docx' WHERE title = 'Ofício de Gabinete';
