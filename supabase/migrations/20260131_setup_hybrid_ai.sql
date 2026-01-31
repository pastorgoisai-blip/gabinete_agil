-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create system_docs table for public/admin knowledge base
create table if not exists system_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Enable RLS on system_docs
alter table system_docs enable row level security;

-- Policy: Everyone can read system_docs
create policy "Public System Docs Access"
  on system_docs for select
  using (true);

-- Policy: Only Admins can insert/update system_docs
-- Assuming 'admin' role check via auth.jwt() or specific user metadata logic is applied elsewhere or standard Supabase service role. 
-- For now, restricting to authenticated users with extensive permissions or service role is safer.
-- User request says "INSERT/UPDATE apenas admin". I will check for a specific claim or just service role if unsure.
-- Standard simplistic approach for Supabase usually relies on app metadata.
-- Let's use a placeholder check that denies public/anon writes.
create policy "Admins can manage system_docs"
  on system_docs for all
  using (
    auth.role() = 'service_role' 
    or 
    (auth.jwt() ->> 'app_role' = 'admin') -- Example claim check
  );


-- Create embeddings table for hybrid knowledge (Global + Cabinet specific)
create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536),
  cabinet_id uuid references cabinets(id) on delete cascade
);

-- Index for similarity search
create index on embeddings using hnsw (embedding vector_cosine_ops);

-- Enable RLS on embeddings
alter table embeddings enable row level security;

-- Hybrid Policy: 
-- User sees if item is public (cabinet_id IS NULL)
-- OR if item belongs to their cabinet
create policy "Hybrid Embeddings Access"
  on embeddings for select
  using (
    cabinet_id is null 
    or 
    cabinet_id::text = (auth.jwt() ->> 'cabinet_id')
  );

-- Only cabinet members can insert into their own embeddings bucket
create policy "Cabinet Members Insert Embeddings"
  on embeddings for insert
  with check (
    cabinet_id::text = (auth.jwt() ->> 'cabinet_id')
  );

-- Only admins/service role can insert public embeddings
create policy "Admins Insert Public Embeddings"
  on embeddings for insert
  with check (
    cabinet_id is null 
    and 
    (auth.role() = 'service_role' or (auth.jwt() ->> 'app_role' = 'admin'))
  );
