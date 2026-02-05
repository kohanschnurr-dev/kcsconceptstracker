-- Create operation_codes table for immutable project rules
CREATE TABLE IF NOT EXISTS public.operation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quarterly_goals table for tracking business targets
CREATE TABLE IF NOT EXISTS public.quarterly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  quarter TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.operation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operation_codes
CREATE POLICY "Users can view own codes" ON public.operation_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own codes" ON public.operation_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON public.operation_codes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own codes" ON public.operation_codes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quarterly_goals
CREATE POLICY "Users can view own goals" ON public.quarterly_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.quarterly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.quarterly_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.quarterly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_operation_codes_updated_at
  BEFORE UPDATE ON public.operation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quarterly_goals_updated_at
  BEFORE UPDATE ON public.quarterly_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();