-- Add assigned_to column to demands table for tracking responsibility
alter table demands 
add column if not exists assigned_to text;

comment on column demands.assigned_to is 'Campo de texto livre para responsável pelo acompanhamento (pessoa ou equipe)';

-- Create index for faster filtering by assigned_to if needed in future
create index if not exists demands_assigned_to_idx on demands(assigned_to);

-- Ensure RLS allows update of this field (assuming existing policies cover updates for authenticated users or specific roles)
-- If specific policies are needed, they should be added here. 
-- For now, relying on existing RLS for 'demands' table.
