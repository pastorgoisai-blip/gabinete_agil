-- Add branding columns to cabinets table
ALTER TABLE cabinets
ADD COLUMN IF NOT EXISTS header_url TEXT,
ADD COLUMN IF NOT EXISTS footer_url TEXT,
ADD COLUMN IF NOT EXISTS official_name TEXT;

-- Verify RLS (assuming cabinets table exists and policies are generally set, we ensure update is possible)
-- This part is just a comment as we trust existing RLS for now or will debug if "Settings" update fails.
