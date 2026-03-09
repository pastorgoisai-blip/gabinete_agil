-- Migration: Setup Background Tasks Queue

CREATE TABLE IF NOT EXISTS public.background_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_details TEXT,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast polling of pending tasks
CREATE INDEX IF NOT EXISTS idx_background_tasks_status_created_at 
ON public.background_tasks(status, created_at) 
WHERE status = 'pending';

-- Index for searching by task type
CREATE INDEX IF NOT EXISTS idx_background_tasks_task_type 
ON public.background_tasks(task_type);

-- Trigger to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_background_tasks_updated_at
    BEFORE UPDATE ON public.background_tasks
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- RPC function to atomically claim a task
CREATE OR REPLACE FUNCTION public.claim_next_task()
RETURNS SETOF public.background_tasks AS $$
DECLARE
    next_task_id UUID;
BEGIN
    -- Find and lock the next pending task
    SELECT id INTO next_task_id
    FROM public.background_tasks
    WHERE status = 'pending'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF next_task_id IS NOT NULL THEN
        -- Update its status to processing
        UPDATE public.background_tasks
        SET status = 'processing', updated_at = now()
        WHERE id = next_task_id;

        -- Return the locked task
        RETURN QUERY SELECT * FROM public.background_tasks WHERE id = next_task_id;
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE;
