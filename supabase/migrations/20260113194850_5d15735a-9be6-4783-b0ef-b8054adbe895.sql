-- Create procurement_items table for Cart Aggregator
CREATE TABLE public.procurement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.project_categories(id) ON DELETE SET NULL,
  
  -- Item details
  name TEXT NOT NULL,
  source_url TEXT,
  source_store TEXT CHECK (source_store IN ('amazon', 'home_depot', 'lowes', 'other')),
  model_number TEXT,
  finish TEXT, -- e.g., 'Matte Black', 'Brushed Nickel'
  
  -- Pricing
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  includes_tax BOOLEAN NOT NULL DEFAULT false,
  tax_rate NUMERIC(5, 4) DEFAULT 0.0825, -- Texas 8.25%
  
  -- Execution timing
  phase TEXT CHECK (phase IN ('demo', 'rough_in', 'drywall', 'trim_out', 'final')) DEFAULT 'rough_in',
  lead_time_days INTEGER,
  
  -- Status tracking
  status TEXT CHECK (status IN ('researching', 'in_cart', 'ordered', 'shipped', 'on_site', 'installed')) DEFAULT 'researching',
  
  -- Bulk discount tracking
  bulk_discount_eligible BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.procurement_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own procurement items"
ON public.procurement_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own procurement items"
ON public.procurement_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procurement items"
ON public.procurement_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procurement items"
ON public.procurement_items
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_procurement_items_updated_at
BEFORE UPDATE ON public.procurement_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_procurement_items_project ON public.procurement_items(project_id);
CREATE INDEX idx_procurement_items_category ON public.procurement_items(category_id);
CREATE INDEX idx_procurement_items_status ON public.procurement_items(status);
CREATE INDEX idx_procurement_items_phase ON public.procurement_items(phase);