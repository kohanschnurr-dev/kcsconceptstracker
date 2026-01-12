-- Create a business_expenses table for tracking business expenses independently
CREATE TABLE public.business_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  vendor_name TEXT,
  description TEXT,
  payment_method public.payment_method,
  receipt_url TEXT,
  includes_tax BOOLEAN NOT NULL DEFAULT false,
  tax_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own business expenses"
ON public.business_expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business expenses"
ON public.business_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business expenses"
ON public.business_expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business expenses"
ON public.business_expenses FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();