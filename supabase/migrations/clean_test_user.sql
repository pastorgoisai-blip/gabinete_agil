-- Clean up the specific test user to allow retrying code
-- Run this in Supabase SQL Editor

BEGIN;
  DELETE FROM auth.users WHERE email = 'midiawederson@gmail.com';
COMMIT;
