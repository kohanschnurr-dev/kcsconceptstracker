-- Add is_pack_price column to procurement_items
-- When true, the unit_price is for the whole pack (quantity is just for reference/count)
-- When false (default), unit_price is per-unit and gets multiplied by quantity
ALTER TABLE public.procurement_items 
ADD COLUMN is_pack_price boolean NOT NULL DEFAULT false;