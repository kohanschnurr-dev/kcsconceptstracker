
CREATE TABLE public.loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  description TEXT,
  vendor_name TEXT,
  payment_type TEXT NOT NULL DEFAULT 'other',
  source TEXT NOT NULL DEFAULT 'manual',
  expense_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan payments" ON public.loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loan payments" ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loan payments" ON public.loan_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loan payments" ON public.loan_payments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_loan_payments_updated_at BEFORE UPDATE ON public.loan_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
