-- Create table for storing QuickBooks OAuth tokens
CREATE TABLE public.quickbooks_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for QuickBooks imported expenses (pending categorization)
CREATE TABLE public.quickbooks_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  qb_id TEXT NOT NULL,
  vendor_name TEXT,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  payment_method TEXT,
  is_imported BOOLEAN NOT NULL DEFAULT false,
  project_id UUID REFERENCES public.projects(id),
  category_id UUID REFERENCES public.project_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, qb_id)
);

-- Enable Row Level Security
ALTER TABLE public.quickbooks_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for quickbooks_tokens
CREATE POLICY "Users can view their own tokens"
ON public.quickbooks_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON public.quickbooks_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.quickbooks_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.quickbooks_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for quickbooks_expenses
CREATE POLICY "Users can view their own QB expenses"
ON public.quickbooks_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own QB expenses"
ON public.quickbooks_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QB expenses"
ON public.quickbooks_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QB expenses"
ON public.quickbooks_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_quickbooks_tokens_updated_at
BEFORE UPDATE ON public.quickbooks_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quickbooks_expenses_updated_at
BEFORE UPDATE ON public.quickbooks_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();