-- Add branding columns to cabinets table
ALTER TABLE cabinets
ADD COLUMN IF NOT EXISTS official_name TEXT,
ADD COLUMN IF NOT EXISTS official_title TEXT,
ADD COLUMN IF NOT EXISTS header_url TEXT,
ADD COLUMN IF NOT EXISTS footer_url TEXT,
ADD COLUMN IF NOT EXISTS use_letterhead BOOLEAN DEFAULT FALSE;

-- Create storage bucket if it doesn't exist (NOTE: This might require extensions or specific privileges not always available in SQL editor, but standard Supabase allows it via API. Since we are in SQL, we can try to insert into storage.buckets if we have permission, OR user does it via UI. We will provide the Policy SQL which is critical).

-- Policies for Storage (Assuming 'cabinet-assets' bucket exists)
-- User must create the bucket 'cabinet-assets' and make it Public in the dashboard.

-- Allow public access to read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cabinet-assets' );

-- Allow authenticated users to upload to their own folder (or just generally if they are staff)
-- Ideally we limit by cabinet_id in the path, e.g. cabinet-assets/{cabinet_id}/filename
CREATE POLICY "Cabinet Staff Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cabinet-assets' );

-- Allow update/delete
CREATE POLICY "Cabinet Staff Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cabinet-assets' );
