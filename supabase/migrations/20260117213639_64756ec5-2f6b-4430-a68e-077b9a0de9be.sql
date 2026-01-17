-- Add quantity column to procurement_item_bundles junction table
-- This allows each bundle to have its own quantity for an item
ALTER TABLE public.procurement_item_bundles 
ADD COLUMN quantity integer NOT NULL DEFAULT 1;