-- Create budget_templates table for saving budget plans without projects
CREATE TABLE public.budget_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  purchase_price NUMERIC DEFAULT 0,
  arv NUMERIC DEFAULT 0,
  category_budgets JSONB NOT NULL DEFAULT '{}',
  total_budget NUMERIC GENERATED ALWAYS AS (
    COALESCE((category_budgets->>'demolition')::numeric, 0) +
    COALESCE((category_budgets->>'foundation')::numeric, 0) +
    COALESCE((category_budgets->>'framing')::numeric, 0) +
    COALESCE((category_budgets->>'roofing')::numeric, 0) +
    COALESCE((category_budgets->>'electrical')::numeric, 0) +
    COALESCE((category_budgets->>'plumbing')::numeric, 0) +
    COALESCE((category_budgets->>'hvac')::numeric, 0) +
    COALESCE((category_budgets->>'insulation')::numeric, 0) +
    COALESCE((category_budgets->>'drywall')::numeric, 0) +
    COALESCE((category_budgets->>'flooring')::numeric, 0) +
    COALESCE((category_budgets->>'painting')::numeric, 0) +
    COALESCE((category_budgets->>'cabinets')::numeric, 0) +
    COALESCE((category_budgets->>'countertops')::numeric, 0) +
    COALESCE((category_budgets->>'appliances')::numeric, 0) +
    COALESCE((category_budgets->>'fixtures')::numeric, 0) +
    COALESCE((category_budgets->>'doors_windows')::numeric, 0) +
    COALESCE((category_budgets->>'siding')::numeric, 0) +
    COALESCE((category_budgets->>'landscaping')::numeric, 0) +
    COALESCE((category_budgets->>'permits')::numeric, 0) +
    COALESCE((category_budgets->>'labor')::numeric, 0) +
    COALESCE((category_budgets->>'contingency')::numeric, 0) +
    COALESCE((category_budgets->>'other')::numeric, 0)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own budget templates"
  ON public.budget_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget templates"
  ON public.budget_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget templates"
  ON public.budget_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget templates"
  ON public.budget_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_budget_templates_updated_at
  BEFORE UPDATE ON public.budget_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();