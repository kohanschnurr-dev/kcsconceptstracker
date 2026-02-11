CREATE OR REPLACE FUNCTION public.add_budget_category(new_value text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS %L', new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';