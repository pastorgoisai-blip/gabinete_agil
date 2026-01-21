---
name: supabase-expert
description: Expert in Supabase, PostgreSQL, and Row Level Security (RLS). Use when writing SQL, migrations, or database logic.
---
# Supabase Security Expert
1. RLS is Mandatory: NEVER create a table without enabling RLS.
2. Auth Context: Always use `auth.uid()` in policies.
3. Types: Prefer generated `Database` types over manual interfaces.
