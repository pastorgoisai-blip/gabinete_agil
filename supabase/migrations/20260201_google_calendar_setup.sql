-- Migration: 20260201_google_calendar_setup
-- Description: Adds OAuth columns to cabinets and sync columns to events

-- 1. Update 'cabinets' table with Google OAuth fields
-- These fields are protected by RLS (only service_role or the cabinet owner via specific functions should access)
ALTER TABLE cabinets
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_token_expires_at bigint,
ADD COLUMN IF NOT EXISTS google_calendar_id text DEFAULT 'primary';

-- Comment on sensitive columns
COMMENT ON COLUMN cabinets.google_access_token IS 'Encrypted Google OAuth Access Token';
COMMENT ON COLUMN cabinets.google_refresh_token IS 'Encrypted Google OAuth Refresh Token';

-- 2. Update 'events' table with Google Event ID for syncing
ALTER TABLE events
ADD COLUMN IF NOT EXISTS google_event_id text,
ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add unique constraint to avoid duplicate mappings
ALTER TABLE events
ADD CONSTRAINT events_google_event_id_key UNIQUE (google_event_id);

-- 3. Security (RLS) - Ensure these columns are not accidentally exposed in public selects if policies are loose
-- Note: 'cabinets' usually has strict RLS. We'll assume existing policies cover "Owner can view their own cabinet".
-- Ideally, we might want to restrict 'google_access_token' and 'google_refresh_token' from being selected by the standard UI client
-- unless specifically needed, but Supabase RLS is row-based, not column-based.
-- Solution: We will create a robust Edge Function to handle the Auth exchange so the client never sees the raw tokens,
-- OR we accept that the Client (Owner) executes the sync and needs the token (less secure but simpler).
-- ARCHITECTURE DECISION: For this implementation, Edge Functions will handle the tokens.
-- The Frontend will just know "is_connected".

-- Create a computed column or view if we wanted to hide tokens, but for now we rely on the implementation 
-- preventing direct select of these fields in the frontend unless necessary.

-- 4. Create an index for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
