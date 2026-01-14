-- Add notes column to quickbooks_expenses table if it doesn't exist
ALTER TABLE public.quickbooks_expenses 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add receipt_url column to quickbooks_expenses table if it doesn't exist
ALTER TABLE public.quickbooks_expenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;