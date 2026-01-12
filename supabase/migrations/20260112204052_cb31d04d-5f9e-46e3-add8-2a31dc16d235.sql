-- Add project_type enum and column
CREATE TYPE public.project_type AS ENUM ('fix_flip', 'rental');

-- Add project_type column to projects table with default value
ALTER TABLE public.projects 
ADD COLUMN project_type public.project_type NOT NULL DEFAULT 'fix_flip';