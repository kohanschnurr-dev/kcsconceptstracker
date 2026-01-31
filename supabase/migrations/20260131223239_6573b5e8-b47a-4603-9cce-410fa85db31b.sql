-- Add optional project_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for performance when querying tasks by project
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);

-- Add RLS policy for tasks related to user's projects
-- (existing policies already handle user_id access, this just adds the join capability)