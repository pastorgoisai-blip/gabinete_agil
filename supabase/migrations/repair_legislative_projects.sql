-- FORCE update of the table structure
ALTER TABLE public.legislative_projects
ADD COLUMN IF NOT EXISTS authors TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS type_description TEXT,
ADD COLUMN IF NOT EXISTS type_acronym TEXT,
ADD COLUMN IF NOT EXISTS number INTEGER,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em Tramitação';

-- FORCE Cache Reload for PostgREST (Fixes the "column not found in schema cache" error)
NOTIFY pgrst, 'reload schema';
