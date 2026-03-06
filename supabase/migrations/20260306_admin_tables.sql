-- ============================================
-- Admin Dashboard Tables Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Demo Requests
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'no-show')),
  notes text,
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on demo_requests"
  ON public.demo_requests FOR ALL
  USING (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com');

-- Allow anonymous inserts (for lead capture / demo request forms)
CREATE POLICY "Anyone can submit demo requests"
  ON public.demo_requests FOR INSERT
  WITH CHECK (true);


-- 2. Admin Events (calendar)
CREATE TABLE IF NOT EXISTS public.admin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'custom'
    CHECK (event_type IN ('demo', 'trial_expiration', 'custom')),
  date date NOT NULL,
  time time,
  notes text,
  related_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on admin_events"
  ON public.admin_events FOR ALL
  USING (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com');


-- 3. Admin Settings (key-value)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on admin_settings"
  ON public.admin_settings FOR ALL
  USING (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com');


-- 4. Seed default settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('trial_length_days', '14'),
  ('auto_trial', 'true'),
  ('notify_new_signup', 'true'),
  ('notify_demo_request', 'true'),
  ('notify_trial_expiring_days', '3')
ON CONFLICT (key) DO NOTHING;
