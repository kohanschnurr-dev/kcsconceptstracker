-- Add hard money loan fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hm_loan_amount numeric,
ADD COLUMN IF NOT EXISTS hm_interest_rate numeric,
ADD COLUMN IF NOT EXISTS hm_loan_term_months integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS hm_points numeric DEFAULT 3,
ADD COLUMN IF NOT EXISTS hm_closing_costs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS hm_interest_only boolean DEFAULT true;