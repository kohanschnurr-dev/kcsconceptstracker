-- Create milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_reminder BOOLEAN DEFAULT false,
  reminder_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project vendors (assignment) table
CREATE TABLE public.project_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  scheduled_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, vendor_id)
);

-- Add financial fields to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arv NUMERIC DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_vendors ENABLE ROW LEVEL SECURITY;

-- Milestones policies
CREATE POLICY "Users can view milestones of their projects" 
ON public.project_milestones FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create milestones for their projects" 
ON public.project_milestones FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update milestones of their projects" 
ON public.project_milestones FOR UPDATE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete milestones of their projects" 
ON public.project_milestones FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));

-- Notes policies
CREATE POLICY "Users can view notes of their projects" 
ON public.project_notes FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create notes for their projects" 
ON public.project_notes FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update notes of their projects" 
ON public.project_notes FOR UPDATE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete notes of their projects" 
ON public.project_notes FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid()));

-- Project vendors policies
CREATE POLICY "Users can view vendors of their projects" 
ON public.project_vendors FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_vendors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can assign vendors to their projects" 
ON public.project_vendors FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_vendors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update vendor assignments of their projects" 
ON public.project_vendors FOR UPDATE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_vendors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can remove vendors from their projects" 
ON public.project_vendors FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_vendors.project_id AND projects.user_id = auth.uid()));

-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true);

-- Storage policies for project photos
CREATE POLICY "Anyone can view project photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-photos');

CREATE POLICY "Users can upload project photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their project photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

-- Create project photos table to track uploads
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of their projects" 
ON public.project_photos FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can upload photos to their projects" 
ON public.project_photos FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete photos from their projects" 
ON public.project_photos FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()));