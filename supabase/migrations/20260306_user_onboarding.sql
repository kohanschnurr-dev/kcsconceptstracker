-- User onboarding questionnaire answers
create table if not exists public.user_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text,
  annual_project_volume text,
  pain_points jsonb default '[]'::jsonb,
  current_tools text,
  team_size text,
  created_at timestamptz default now()
);

-- Index for fast lookup by user
create index if not exists idx_user_onboarding_user_id on public.user_onboarding(user_id);

-- RLS
alter table public.user_onboarding enable row level security;

-- Users can insert their own onboarding data
create policy "Users can insert own onboarding"
  on public.user_onboarding for insert
  with check (auth.uid() = user_id);

-- Users can read their own onboarding data
create policy "Users can read own onboarding"
  on public.user_onboarding for select
  using (auth.uid() = user_id);

-- Admin can read all onboarding data (via service role or direct query)
-- For the admin dashboard, we'll use the authenticated user check against admin email
create policy "Admin can read all onboarding"
  on public.user_onboarding for select
  using (
    auth.uid() in (
      select au.id from auth.users au where au.email = 'kohanschnurr@gmail.com'
    )
  );
