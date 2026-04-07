-- Loans feature migration

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  nickname text,
  lender_name text not null,
  lender_contact text,
  loan_type text not null,
  loan_type_other text,
  original_amount numeric not null,
  outstanding_balance numeric not null,
  interest_rate numeric not null,
  rate_type text not null default 'fixed',
  variable_index text,
  variable_margin numeric,
  variable_rate_cap numeric,
  variable_rate_floor numeric,
  variable_adjustment_frequency text,
  loan_term_months integer not null,
  amortization_period_months integer,
  payment_frequency text not null default 'monthly',
  payment_frequency_custom text,
  interest_calc_method text not null default 'standard',
  start_date date not null,
  maturity_date date not null,
  first_payment_date date,
  origination_fee_points numeric,
  origination_fee_dollars numeric,
  other_closing_costs numeric,
  has_prepayment_penalty boolean not null default false,
  prepayment_penalty_terms text,
  extension_fee numeric,
  extension_terms text,
  has_draws boolean not null default false,
  total_draw_amount numeric,
  draw_structure text,
  custom_draw_terms text,
  collateral_type text,
  collateral_description text,
  ltv_at_origination numeric,
  has_personal_guarantee boolean not null default false,
  notes text,
  status text not null default 'active',
  monthly_payment numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loan_draws (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  draw_number integer not null,
  milestone_name text,
  draw_percentage numeric,
  draw_amount numeric not null,
  expected_date date,
  status text not null default 'pending',
  date_funded date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  payment_date date not null,
  amount numeric not null,
  principal_portion numeric,
  interest_portion numeric,
  late_fee numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists loan_documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_at timestamptz not null default now()
);

-- RLS
alter table loans enable row level security;
alter table loan_draws enable row level security;
alter table loan_payments enable row level security;
alter table loan_documents enable row level security;

create policy "Users can manage their own loans"
  on loans for all using (auth.uid() = user_id);

create policy "Users can manage draws for their loans"
  on loan_draws for all using (
    loan_id in (select id from loans where user_id = auth.uid())
  );

create policy "Users can manage payments for their loans"
  on loan_payments for all using (
    loan_id in (select id from loans where user_id = auth.uid())
  );

create policy "Users can manage documents for their loans"
  on loan_documents for all using (
    loan_id in (select id from loans where user_id = auth.uid())
  );

-- Updated-at trigger
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger loans_updated_at
  before update on loans
  for each row execute function update_updated_at_column();
