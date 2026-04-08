
-- 1. crm_contacts
CREATE TABLE public.crm_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  phone_secondary text,
  email text,
  contact_type text NOT NULL DEFAULT 'other',
  contact_type_other text,
  status text NOT NULL DEFAULT 'new_lead',
  source text NOT NULL DEFAULT '',
  source_other text,
  tags text[],
  priority text,
  property_address text,
  property_city text,
  property_state text,
  property_zip text,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  sqft integer,
  year_built integer,
  estimated_arv numeric,
  estimated_repair numeric,
  asking_price numeric,
  offer_amount numeric,
  property_notes text,
  motivation_level integer,
  reason_for_selling text[],
  selling_timeline text,
  mortgage_balance numeric,
  is_occupied text,
  has_liens text,
  previous_wholesale_attempts boolean NOT NULL DEFAULT false,
  previous_wholesale_details text,
  is_dnc boolean NOT NULL DEFAULT false,
  notes text,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crm contacts" ON public.crm_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm contacts" ON public.crm_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm contacts" ON public.crm_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm contacts" ON public.crm_contacts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. crm_activities
CREATE TABLE public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note',
  description text,
  outcome text,
  duration_minutes integer,
  notes text,
  activity_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crm activities" ON public.crm_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm activities" ON public.crm_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm activities" ON public.crm_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm activities" ON public.crm_activities FOR DELETE USING (auth.uid() = user_id);

-- 3. crm_calendar_events
CREATE TABLE public.crm_calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'general_reminder',
  event_date timestamptz NOT NULL,
  duration_minutes integer,
  notes text,
  reminder text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crm calendar events" ON public.crm_calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm calendar events" ON public.crm_calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm calendar events" ON public.crm_calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm calendar events" ON public.crm_calendar_events FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_calendar_events_updated_at BEFORE UPDATE ON public.crm_calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. crm_offers
CREATE TABLE public.crm_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  offer_date date NOT NULL DEFAULT CURRENT_DATE,
  offer_amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'verbal',
  response text NOT NULL DEFAULT 'pending',
  counter_amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crm offers" ON public.crm_offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own crm offers" ON public.crm_offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crm offers" ON public.crm_offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crm offers" ON public.crm_offers FOR DELETE USING (auth.uid() = user_id);
