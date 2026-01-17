-- Add image_url column to procurement_items for storing product screenshots
ALTER TABLE public.procurement_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;