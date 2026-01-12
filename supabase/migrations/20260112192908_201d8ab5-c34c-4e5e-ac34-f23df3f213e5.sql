-- Create table to store OAuth states for QuickBooks
CREATE TABLE public.quickbooks_oauth_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  state text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.quickbooks_oauth_states ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own states
CREATE POLICY "Users can insert their own oauth states"
ON public.quickbooks_oauth_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own oauth states"
ON public.quickbooks_oauth_states
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth states"
ON public.quickbooks_oauth_states
FOR DELETE
USING (auth.uid() = user_id);

-- Service role needs full access for callback handling
CREATE POLICY "Service role has full access"
ON public.quickbooks_oauth_states
FOR ALL
USING (true)
WITH CHECK (true);