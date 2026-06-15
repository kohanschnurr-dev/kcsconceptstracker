CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  role text,
  notes text,
  slot_at timestamptz NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  timezone text,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.demo_bookings TO anon;
GRANT INSERT ON public.demo_bookings TO authenticated;
GRANT ALL ON public.demo_bookings TO service_role;

ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a demo"
  ON public.demo_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS demo_bookings_slot_at_booked_idx
  ON public.demo_bookings (slot_at)
  WHERE status = 'booked';

CREATE INDEX IF NOT EXISTS demo_bookings_slot_at_idx
  ON public.demo_bookings (slot_at);

CREATE TRIGGER update_demo_bookings_updated_at
  BEFORE UPDATE ON public.demo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();