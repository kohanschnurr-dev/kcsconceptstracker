-- CRM feature migration

create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  phone_secondary text,
  email text,
  contact_type text not null,
  contact_type_other text,
  status text not null default 'new_lead',
  source text not null,
  source_other text,
  tags text[],
  priority text default 'medium',
  property_address text,
  property_city text,
  property_state text default 'TX',
  property_zip text,
  property_type text,
  bedrooms integer,
  bathrooms numeric,
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
  is_occupied text default 'unknown',
  has_liens text default 'unknown',
  previous_wholesale_attempts boolean default false,
  previous_wholesale_details text,
  is_dnc boolean default false,
  notes text,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  description text,
  outcome text,
  duration_minutes integer,
  notes text,
  activity_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists crm_calendar_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_type text not null,
  event_date timestamptz not null,
  duration_minutes integer,
  notes text,
  reminder text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_offers (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_date date not null,
  offer_amount numeric not null,
  method text not null default 'verbal',
  response text not null default 'pending',
  counter_amount numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists crm_documents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_at timestamptz not null default now()
);

-- RLS
alter table crm_contacts enable row level security;
alter table crm_activities enable row level security;
alter table crm_calendar_events enable row level security;
alter table crm_offers enable row level security;
alter table crm_documents enable row level security;

create policy "Users manage their CRM contacts"
  on crm_contacts for all using (auth.uid() = user_id);

create policy "Users manage their CRM activities"
  on crm_activities for all using (
    contact_id in (select id from crm_contacts where user_id = auth.uid())
  );

create policy "Users manage their CRM calendar events"
  on crm_calendar_events for all using (auth.uid() = user_id);

create policy "Users manage their CRM offers"
  on crm_offers for all using (auth.uid() = user_id);

create policy "Users manage their CRM documents"
  on crm_documents for all using (auth.uid() = user_id);

-- Updated-at trigger (reuse or create)
create or replace function update_crm_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger crm_contacts_updated_at
  before update on crm_contacts
  for each row execute function update_crm_updated_at();

create trigger crm_calendar_events_updated_at
  before update on crm_calendar_events
  for each row execute function update_crm_updated_at();
