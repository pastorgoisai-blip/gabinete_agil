-- ============================================================================
-- ONLYOFFICE INTEGRATION: STORAGE POLICIES
-- ============================================================================
-- Este script configura as permissões de segurança (RLS) para o bucket 
-- "legislative-documents" usado pelo OnlyOffice.
--
-- REGRA DE OURO: Apenas membros do gabinete podem acessar documentos do 
-- seu próprio gabinete (Multi-Tenancy)
-- ============================================================================

-- 1. Criar o bucket "legislative-documents" (se não existir)
-- Execute no Supabase Dashboard > Storage > Create Bucket
-- Nome: legislative-documents
-- Public: NO (Private)
-- File size limit: 50MB
-- Allowed MIME types: application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- 2. Habilitar RLS no bucket (caso não esteja habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: SELECT (Leitura) - Usuários podem VER documentos do seu gabinete
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their cabinet documents" ON storage.objects;

CREATE POLICY "Users can view their cabinet documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'legislative-documents' 
  AND
  -- Extrai o cabinet_id do path do arquivo (formato: "cabinet_id/filename.docx")
  (storage.foldername(name))[1] = (
    SELECT cabinet_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- ============================================================================
-- POLICY 2: INSERT (Upload) - Usuários podem CRIAR documentos no seu gabinete
-- ============================================================================
DROP POLICY IF EXISTS "Users can upload to their cabinet folder" ON storage.objects;

CREATE POLICY "Users can upload to their cabinet folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'legislative-documents' 
  AND
  -- Verifica se o usuário está fazendo upload na pasta do SEU gabinete
  (storage.foldername(name))[1] = (
    SELECT cabinet_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- ============================================================================
-- POLICY 3: UPDATE (Edição) - Usuários podem ATUALIZAR documentos do seu gabinete
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their cabinet documents" ON storage.objects;

CREATE POLICY "Users can update their cabinet documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'legislative-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT cabinet_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'legislative-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT cabinet_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- ============================================================================
-- POLICY 4: DELETE (Exclusão) - Usuários podem DELETAR documentos do seu gabinete
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete their cabinet documents" ON storage.objects;

CREATE POLICY "Users can delete their cabinet documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'legislative-documents' 
  AND
  (storage.foldername(name))[1] = (
    SELECT cabinet_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICAÇÃO: Testar se as policies estão ativas
-- ============================================================================
-- Execute este SELECT para verificar se as 4 policies foram criadas:
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%cabinet%'
ORDER BY policyname;
