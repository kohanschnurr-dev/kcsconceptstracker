ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cashflow_rehab_mode text DEFAULT 'budget',
  ADD COLUMN IF NOT EXISTS cashflow_tax_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_insurance_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_hoa_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_maintenance_period text DEFAULT 'month';