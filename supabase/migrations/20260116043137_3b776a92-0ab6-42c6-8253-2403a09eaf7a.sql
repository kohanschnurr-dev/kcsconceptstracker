-- Add scheduling columns to tasks table for Command Center
ALTER TABLE public.tasks 
ADD COLUMN is_scheduled boolean NOT NULL DEFAULT false,
ADD COLUMN start_time time,
ADD COLUMN end_time time;

-- Create index for efficient querying of scheduled tasks
CREATE INDEX idx_tasks_scheduled ON public.tasks (is_scheduled, scheduled_date, start_time)
WHERE is_scheduled = true;