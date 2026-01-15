-- Create daily_log_tasks table
CREATE TABLE public.daily_log_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_log_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (access through parent daily_log -> project -> user)
CREATE POLICY "Users can view tasks of their logs"
ON public.daily_log_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM daily_logs dl
    JOIN projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks for their logs"
ON public.daily_log_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM daily_logs dl
    JOIN projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks of their logs"
ON public.daily_log_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM daily_logs dl
    JOIN projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks of their logs"
ON public.daily_log_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM daily_logs dl
    JOIN projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_log_tasks_updated_at
BEFORE UPDATE ON public.daily_log_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();