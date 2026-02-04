-- Add title column to project_documents for custom display names
ALTER TABLE public.project_documents
ADD COLUMN title TEXT DEFAULT NULL;