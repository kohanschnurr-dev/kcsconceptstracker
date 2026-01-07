-- Create enums for type safety
CREATE TYPE public.project_status AS ENUM ('active', 'complete', 'on_hold');
CREATE TYPE public.budget_category AS ENUM ('foundation', 'plumbing', 'hvac', 'electrical', 'roof', 'interior', 'kitchen', 'fixtures');
CREATE TYPE public.expense_status AS ENUM ('estimate', 'actual');
CREATE TYPE public.payment_method AS ENUM ('cash', 'check', 'card', 'transfer');
CREATE TYPE public.vendor_trade AS ENUM ('foundation', 'plumbing', 'hvac', 'electrical', 'roof', 'interior', 'kitchen', 'fixtures', 'general');
CREATE TYPE public.pricing_model AS ENUM ('flat', 'hourly');

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project budget categories
CREATE TABLE public.project_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category public.budget_category NOT NULL,
  estimated_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, category)
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade public.vendor_trade NOT NULL,
  phone TEXT,
  email TEXT,
  has_w9 BOOLEAN NOT NULL DEFAULT false,
  insurance_expiry DATE,
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  pricing_model public.pricing_model,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.project_categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_name TEXT,
  payment_method public.payment_method,
  status public.expense_status NOT NULL DEFAULT 'actual',
  description TEXT,
  includes_tax BOOLEAN NOT NULL DEFAULT false,
  tax_amount DECIMAL(12,2),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  contractors_on_site UUID[] DEFAULT '{}',
  work_performed TEXT,
  issues TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project categories RLS policies (access via project ownership)
CREATE POLICY "Users can view categories of their projects" ON public.project_categories
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_categories.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create categories for their projects" ON public.project_categories
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_categories.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update categories of their projects" ON public.project_categories
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_categories.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete categories of their projects" ON public.project_categories
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_categories.project_id AND projects.user_id = auth.uid()
  ));

-- Vendors RLS policies
CREATE POLICY "Users can view their own vendors" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendors" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" ON public.vendors
  FOR DELETE USING (auth.uid() = user_id);

-- Expenses RLS policies (access via project ownership)
CREATE POLICY "Users can view expenses of their projects" ON public.expenses
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = expenses.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create expenses for their projects" ON public.expenses
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = expenses.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update expenses of their projects" ON public.expenses
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = expenses.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete expenses of their projects" ON public.expenses
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = expenses.project_id AND projects.user_id = auth.uid()
  ));

-- Daily logs RLS policies (access via project ownership)
CREATE POLICY "Users can view logs of their projects" ON public.daily_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = daily_logs.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create logs for their projects" ON public.daily_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = daily_logs.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update logs of their projects" ON public.daily_logs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = daily_logs.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete logs of their projects" ON public.daily_logs
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = daily_logs.project_id AND projects.user_id = auth.uid()
  ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();