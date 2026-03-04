-- Rate limiting table for edge functions
-- Records individual calls per user per function for rolling-window rate limiting.

CREATE TABLE IF NOT EXISTS public.rate_limit_calls (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT      NOT NULL,
  called_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to make the rate check query fast
CREATE INDEX IF NOT EXISTS rate_limit_calls_user_fn_time
  ON public.rate_limit_calls (user_id, function_name, called_at DESC);

-- Enable RLS — only the service role (used inside edge functions) may write.
-- Regular users must never be able to manipulate their own call records.
ALTER TABLE public.rate_limit_calls ENABLE ROW LEVEL SECURITY;

-- No RLS policies for regular users — all access goes through the service role
-- inside edge functions, which bypasses RLS by design.
