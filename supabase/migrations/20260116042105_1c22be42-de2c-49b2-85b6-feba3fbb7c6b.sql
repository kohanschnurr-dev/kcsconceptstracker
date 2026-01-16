-- Add is_daily flag and scheduled_date to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_daily boolean NOT NULL DEFAULT false,
ADD COLUMN scheduled_date date NULL;

-- Create index for efficient daily task queries
CREATE INDEX idx_tasks_daily_scheduled ON public.tasks (is_daily, scheduled_date) WHERE is_daily = true;