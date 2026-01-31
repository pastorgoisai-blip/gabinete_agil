-- Add Agent Access Token to cabinets
alter table cabinets 
add column if not exists agent_access_token text unique;

comment on column cabinets.agent_access_token is 'Secret token for external agents (n8n, Evolution API) to authenticate';

-- Create table for Agent Logs (Audit & Billing)
create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid references cabinets(id) on delete cascade,
  agent_name text not null, -- e.g., 'whatsapp_scheduler', 'n8n_flow'
  action text not null, -- e.g., 'create_demand', 'list_agenda'
  status text not null, -- 'success', 'error'
  payload jsonb default '{}', -- The input arguments provided by the agent
  response_summary jsonb default '{}', -- Brief summary of output or error message
  created_at timestamptz default now()
);

-- Indexes for fast querying of logs
create index if not exists agent_logs_cabinet_idx on agent_logs(cabinet_id);
create index if not exists agent_logs_created_at_idx on agent_logs(created_at desc);

-- RLS for agent_logs
alter table agent_logs enable row level security;

-- Cabinet owners can view their own agent logs
create policy "Owners view own agent logs"
  on agent_logs for select
  using (
    cabinet_id::text = (auth.jwt() ->> 'cabinet_id')
  );

-- Service Role (Edge Function) can insert logs
create policy "Service Role manages logs"
  on agent_logs for all
  using (
    auth.role() = 'service_role'
  );

-- Super Admin can view all logs
create policy "Super Admins view all agent logs"
  on agent_logs for select
  using (
    is_super_admin()
  );
