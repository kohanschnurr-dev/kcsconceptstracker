-- Add unique constraint to prevent duplicate QuickBooks expenses
-- The combination of user_id and qb_id should be unique
ALTER TABLE public.quickbooks_expenses 
ADD CONSTRAINT quickbooks_expenses_user_id_qb_id_unique UNIQUE (user_id, qb_id);