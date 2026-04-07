
ALTER TABLE public.calendar_events
  ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN completed_at TIMESTAMPTZ,
  ADD COLUMN linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
