ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS projects_deleted_at_idx ON public.projects (deleted_at) WHERE deleted_at IS NOT NULL;