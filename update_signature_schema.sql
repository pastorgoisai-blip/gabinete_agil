-- Add signature columns to offices
ALTER TABLE offices ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE offices ADD COLUMN IF NOT EXISTS signature_hash text;
-- Note: 'Assinado' is a status logic, but status column is text/enum. We will rely on text update.
