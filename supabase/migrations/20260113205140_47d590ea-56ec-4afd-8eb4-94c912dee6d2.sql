-- Create procurement_bundles table
CREATE TABLE public.procurement_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procurement_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bundles"
ON public.procurement_bundles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bundles"
ON public.procurement_bundles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bundles"
ON public.procurement_bundles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bundles"
ON public.procurement_bundles
FOR DELETE
USING (auth.uid() = user_id);

-- Add bundle_id to procurement_items (replace project_id)
ALTER TABLE public.procurement_items
ADD COLUMN bundle_id UUID REFERENCES public.procurement_bundles(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_procurement_bundles_updated_at
BEFORE UPDATE ON public.procurement_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();