
ALTER TABLE public.projects
  ADD COLUMN closing_costs_mode text NOT NULL DEFAULT 'pct',
  ADD COLUMN holding_costs_mode text NOT NULL DEFAULT 'pct',
  ADD COLUMN closing_costs_flat numeric DEFAULT 0,
  ADD COLUMN holding_costs_flat numeric DEFAULT 0;
