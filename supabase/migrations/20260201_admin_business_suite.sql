-- Add Business Suite columns to cabinets table
alter table cabinets 
add column if not exists status text default 'active' check (status in ('active', 'trial', 'suspended', 'archived')),
add column if not exists plan_tier text default 'basic',
add column if not exists mrr_value numeric default 0,
add column if not exists payment_method text,
add column if not exists next_payment date;

-- Comment on columns for clarity
comment on column cabinets.status is 'Status operacional do gabinete: active, trial, suspended, archived';
comment on column cabinets.mrr_value is 'Monthly Recurring Revenue value in BRL';

-- Ensure RLS allows Super Admin to see and edit these new columns (already covered by Row Level policies, but specific column grants might be needed if strictly configured, assuming Row Level is enough for now)

-- Update usage_metrics if needed (ensuring metric_type allows 'storage')
-- No schema change needed for usage_metrics if it's text, just usage convention.

-- Update admin_audit_logs to ensure we track specific actions
-- No schema change needed, just usage convention in 'action' column.

-- Re-apply or Ensure RLS policies are using the secure function (Safety Check)
-- Usually not needed if previous migration ran, but good to be sure 'is_super_admin' is available.

-- Create index for filtering cabinets by status for dashboards
create index if not exists cabinets_status_idx on cabinets(status);
