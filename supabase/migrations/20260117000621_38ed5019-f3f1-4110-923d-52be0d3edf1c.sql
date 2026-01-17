-- Create junction table for many-to-many relationship between procurement items and bundles
CREATE TABLE public.procurement_item_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.procurement_items(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.procurement_bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, bundle_id)
);

-- Enable RLS
ALTER TABLE public.procurement_item_bundles ENABLE ROW LEVEL SECURITY;

-- RLS policies for the junction table (based on user_id from procurement_items)
CREATE POLICY "Users can view their item bundle assignments" 
ON public.procurement_item_bundles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.procurement_items 
  WHERE procurement_items.id = item_id 
  AND procurement_items.user_id = auth.uid()
));

CREATE POLICY "Users can create item bundle assignments" 
ON public.procurement_item_bundles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.procurement_items 
  WHERE procurement_items.id = item_id 
  AND procurement_items.user_id = auth.uid()
));

CREATE POLICY "Users can delete item bundle assignments" 
ON public.procurement_item_bundles 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.procurement_items 
  WHERE procurement_items.id = item_id 
  AND procurement_items.user_id = auth.uid()
));

-- Migrate existing bundle_id data to the junction table
INSERT INTO public.procurement_item_bundles (item_id, bundle_id)
SELECT id, bundle_id FROM public.procurement_items WHERE bundle_id IS NOT NULL;

-- Create index for performance
CREATE INDEX idx_procurement_item_bundles_item_id ON public.procurement_item_bundles(item_id);
CREATE INDEX idx_procurement_item_bundles_bundle_id ON public.procurement_item_bundles(bundle_id);