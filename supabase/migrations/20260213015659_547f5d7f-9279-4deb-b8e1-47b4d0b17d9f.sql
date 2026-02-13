
-- Subscription tier on profiles
ALTER TABLE profiles ADD COLUMN subscription_tier text NOT NULL DEFAULT 'free';

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Security-definer function to get team owner
CREATE OR REPLACE FUNCTION public.get_team_owner_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.owner_id
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  LIMIT 1
$$;

-- RLS policies for teams
CREATE POLICY "Owners can manage their team"
  ON public.teams FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = id AND tm.user_id = auth.uid()
    )
  );

-- RLS policies for team_members
CREATE POLICY "Owners can manage team members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view their own membership"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid());

-- RLS policies for team_invitations
CREATE POLICY "Owners can manage invitations"
  ON public.team_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Invited users can view their invitation"
  ON public.team_invitations FOR SELECT
  USING (
    lower(email) = lower(
      (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
    )
  );
