-- Add expense_type column to quickbooks_expenses table
ALTER TABLE public.quickbooks_expenses 
ADD COLUMN expense_type text DEFAULT 'product' CHECK (expense_type IN ('product', 'labor'));

-- Add expense_type column to regular expenses table as well for consistency
ALTER TABLE public.expenses 
ADD COLUMN expense_type text DEFAULT 'product' CHECK (expense_type IN ('product', 'labor'));