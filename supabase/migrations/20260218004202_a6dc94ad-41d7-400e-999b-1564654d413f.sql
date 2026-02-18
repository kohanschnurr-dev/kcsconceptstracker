ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS est_labor_budget numeric,
  ADD COLUMN IF NOT EXISTS est_materials_budget numeric;