-- Allow project_id to be null for unassigned procurement items
ALTER TABLE public.procurement_items 
ALTER COLUMN project_id DROP NOT NULL;

-- Drop and recreate the source_store check constraint to include floor_decor
ALTER TABLE public.procurement_items 
DROP CONSTRAINT IF EXISTS procurement_items_source_store_check;

-- No check constraint needed since we're using a text field with controlled values from the frontend