-- Add parent_id column to document_folders for nested folder hierarchy
ALTER TABLE public.document_folders
ADD COLUMN parent_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;

-- Create index for faster parent lookups
CREATE INDEX idx_document_folders_parent_id ON public.document_folders(parent_id);