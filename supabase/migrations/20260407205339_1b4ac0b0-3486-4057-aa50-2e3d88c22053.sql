ALTER TABLE public.loan_payments 
  ADD COLUMN IF NOT EXISTS principal_portion numeric,
  ADD COLUMN IF NOT EXISTS interest_portion numeric,
  ADD COLUMN IF NOT EXISTS late_fee numeric;