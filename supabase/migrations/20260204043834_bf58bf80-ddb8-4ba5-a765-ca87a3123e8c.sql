-- Create project_documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  notes TEXT,
  document_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their project documents" 
ON public.project_documents FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_documents.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert project documents"
ON public.project_documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_documents.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update their project documents"
ON public.project_documents FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_documents.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete their project documents"
ON public.project_documents FOR DELETE
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_documents.project_id 
  AND projects.user_id = auth.uid()
));

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-documents', 'project-documents', true);

-- Storage policies
CREATE POLICY "Anyone can view project documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');