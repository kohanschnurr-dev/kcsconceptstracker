-- Add account_name column to track which QB account/card expenses come from
ALTER TABLE public.quickbooks_expenses 
ADD COLUMN IF NOT EXISTS account_name text;