-- Gantt chart enhancements: owner assignment and structured dependency tracking

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS dependencies jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.calendar_events.owner IS 'Person or entity responsible for this task/event';
COMMENT ON COLUMN public.calendar_events.dependencies IS 'Array of {taskId, type} — type is FS|SS|FF|SF';
