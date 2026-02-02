-- Create loan_presets table for user-saved loan configurations
CREATE TABLE public.loan_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_term_months INTEGER NOT NULL,
  points NUMERIC NOT NULL,
  closing_costs_percent NUMERIC DEFAULT 2,
  interest_only BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loan_presets ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own presets
CREATE POLICY "Users can manage their own loan presets"
  ON public.loan_presets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_presets_updated_at
BEFORE UPDATE ON public.loan_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();