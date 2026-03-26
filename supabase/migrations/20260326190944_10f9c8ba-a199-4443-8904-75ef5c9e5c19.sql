ALTER TABLE public.budget_templates DROP COLUMN total_budget;
ALTER TABLE public.budget_templates ADD COLUMN total_budget numeric DEFAULT 0;
UPDATE public.budget_templates SET total_budget = (SELECT COALESCE(SUM(val::numeric), 0) FROM jsonb_each_text(category_budgets) AS kv(key, val) WHERE key != '_meta' AND val ~ '^\d+\.?\d*$');