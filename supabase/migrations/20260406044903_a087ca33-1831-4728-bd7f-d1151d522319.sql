-- Add 'new_construction' to the project_type enum
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'new_construction';