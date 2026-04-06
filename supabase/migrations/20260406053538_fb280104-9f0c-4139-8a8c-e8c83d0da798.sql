
ALTER TABLE public.quickbooks_expenses ADD COLUMN hidden_at timestamptz;

UPDATE public.quickbooks_expenses SET hidden_at = updated_at WHERE is_hidden = true AND hidden_at IS NULL;
