
-- 1. Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  nickname TEXT,
  lender_name TEXT NOT NULL,
  lender_contact TEXT,
  loan_type TEXT NOT NULL DEFAULT 'hard_money',
  loan_type_other TEXT,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  rate_type TEXT NOT NULL DEFAULT 'fixed',
  variable_index TEXT,
  variable_margin NUMERIC,
  variable_rate_cap NUMERIC,
  variable_rate_floor NUMERIC,
  variable_adjustment_frequency TEXT,
  loan_term_months INTEGER NOT NULL DEFAULT 12,
  amortization_period_months INTEGER,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',
  payment_frequency_custom TEXT,
  interest_calc_method TEXT NOT NULL DEFAULT 'standard_30_360',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '12 months'),
  first_payment_date DATE,
  origination_fee_points NUMERIC,
  origination_fee_dollars NUMERIC,
  other_closing_costs NUMERIC,
  has_prepayment_penalty BOOLEAN NOT NULL DEFAULT false,
  prepayment_penalty_terms TEXT,
  extension_fee NUMERIC,
  extension_terms TEXT,
  has_draws BOOLEAN NOT NULL DEFAULT false,
  total_draw_amount NUMERIC,
  draw_structure TEXT,
  custom_draw_terms TEXT,
  collateral_type TEXT,
  collateral_description TEXT,
  ltv_at_origination NUMERIC,
  has_personal_guarantee BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_payment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Team members can view owner loans" ON public.loans FOR SELECT USING (user_id = get_team_owner_id(auth.uid()));

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create loan_draws table
CREATE TABLE public.loan_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  draw_number INTEGER NOT NULL DEFAULT 1,
  milestone_name TEXT,
  draw_percentage NUMERIC,
  draw_amount NUMERIC NOT NULL DEFAULT 0,
  expected_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  date_funded DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan draws" ON public.loan_draws FOR SELECT USING (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_draws.loan_id AND l.user_id = auth.uid()));
CREATE POLICY "Users can create their own loan draws" ON public.loan_draws FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_draws.loan_id AND l.user_id = auth.uid()));
CREATE POLICY "Users can update their own loan draws" ON public.loan_draws FOR UPDATE USING (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_draws.loan_id AND l.user_id = auth.uid()));
CREATE POLICY "Users can delete their own loan draws" ON public.loan_draws FOR DELETE USING (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_draws.loan_id AND l.user_id = auth.uid()));
CREATE POLICY "Team members can view owner loan draws" ON public.loan_draws FOR SELECT USING (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_draws.loan_id AND l.user_id = get_team_owner_id(auth.uid())));

-- 3. Add loan_id to existing loan_payments
ALTER TABLE public.loan_payments ADD COLUMN loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE;
