-- Create a junction table for project-specific procurement items
CREATE TABLE public.project_procurement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.procurement_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'researching',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.project_procurement_items ENABLE ROW LEVEL SECURITY;

-- Create policies for project procurement items
CREATE POLICY "Users can view project procurement items for their projects"
ON public.project_procurement_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_procurement_items.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert project procurement items for their projects"
ON public.project_procurement_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_procurement_items.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update project procurement items for their projects"
ON public.project_procurement_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_procurement_items.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete project procurement items for their projects"
ON public.project_procurement_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_procurement_items.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_project_procurement_items_project ON public.project_procurement_items(project_id);
CREATE INDEX idx_project_procurement_items_item ON public.project_procurement_items(item_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_procurement_items_updated_at
BEFORE UPDATE ON public.project_procurement_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();