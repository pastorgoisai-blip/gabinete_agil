-- Create table for tracking usage metrics (tokens, messages, storage, etc.)
create table if not exists usage_metrics (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid references cabinets(id) on delete cascade,
  metric_type text not null, -- 'token_usage', 'messages_sent', 'storage_bytes'
  value numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Index for fast aggregation
create index if not exists usage_metrics_cabinet_date_idx on usage_metrics(cabinet_id, date);

-- Create Audit Log table for Super Admin actions
create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id), -- Who performed the action
  target_cabinet_id uuid references cabinets(id), -- Which cabinet was affected
  action text not null, -- 'update_api_key', 'reset_ai_context', 'change_plan'
  details jsonb default '{}', -- Previous values, new values, reasoning
  created_at timestamptz default now()
);

-- Enable RLS
alter table usage_metrics enable row level security;
alter table admin_audit_logs enable row level security;

-- Helper function to bypass RLS recursion
create or replace function public.is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and is_super_admin = true
  );
end;
$$;

-- RLS for usage_metrics
drop policy if exists "Owners view own metrics" on usage_metrics;
create policy "Owners view own metrics"
  on usage_metrics for select
  using (
    cabinet_id::text = (auth.jwt() ->> 'cabinet_id')
  );

drop policy if exists "Super Admins view all metrics" on usage_metrics;
create policy "Super Admins view all metrics"
  on usage_metrics for select
  using (
    is_super_admin()
  );

-- RLS for admin_audit_logs
drop policy if exists "Super Admins manage audit logs" on admin_audit_logs;
create policy "Super Admins manage audit logs"
  on admin_audit_logs for all
  using (
    is_super_admin()
  );

-- --- GOD MODE RLS UPDATES ---
-- Update existing policies to allow Super Admin access to critical tables

-- Cabinets: Allow Super Admin to SELECT and UPDATE any cabinet
drop policy if exists "Super Admins view all cabinets" on cabinets;
create policy "Super Admins view all cabinets"
  on cabinets for select
  using (
    is_super_admin()
  );

drop policy if exists "Super Admins update all cabinets" on cabinets;
create policy "Super Admins update all cabinets"
  on cabinets for update
  using (
    is_super_admin()
  );

-- Agent Configs: Allow Super Admin to manage any agent config
drop policy if exists "Super Admins manage all agent configs" on agent_configurations;
create policy "Super Admins manage all agent configs"
  on agent_configurations for all
  using (
    is_super_admin()
  );

-- Agent Rules: Allow Super Admin to manage any agent rules
drop policy if exists "Super Admins manage all agent rules" on agent_rules;
create policy "Super Admins manage all agent rules"
  on agent_rules for all
  using (
    is_super_admin()
  );

-- Profiles: Allow Super Admin to view all profiles
drop policy if exists "Super Admins view all profiles" on profiles;
create policy "Super Admins view all profiles"
  on profiles for select
  using (
    is_super_admin()
  );
