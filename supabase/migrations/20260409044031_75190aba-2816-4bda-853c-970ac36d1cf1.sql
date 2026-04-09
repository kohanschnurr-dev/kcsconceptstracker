ALTER TABLE public.loan_draws
  ADD COLUMN fee_amount numeric DEFAULT NULL,
  ADD COLUMN fee_percentage numeric DEFAULT NULL,
  ADD COLUMN interest_rate_override numeric DEFAULT NULL;