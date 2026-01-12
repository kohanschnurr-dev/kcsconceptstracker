-- Change trade from single value to array
ALTER TABLE public.vendors 
  DROP COLUMN trade,
  ADD COLUMN trades text[] NOT NULL DEFAULT '{}';

-- Drop insurance_expiry column
ALTER TABLE public.vendors 
  DROP COLUMN insurance_expiry;