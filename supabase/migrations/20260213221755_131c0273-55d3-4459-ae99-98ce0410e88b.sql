ALTER TABLE public.business_expenses
  ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;