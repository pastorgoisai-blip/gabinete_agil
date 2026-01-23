-- Create a new storage bucket for legislative documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('legislative-documents', 'legislative-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload legislative docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legislative-documents'
);

-- Policy to allow authenticated users to view files from their cabinet
CREATE POLICY "Users can view their cabinet's legislative docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'legislative-documents'
);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete their cabinet's legislative docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'legislative-documents' 
);
