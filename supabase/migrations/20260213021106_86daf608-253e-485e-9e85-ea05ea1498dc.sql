
-- 1. Create SECURITY DEFINER function to check team membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  )
$$;

-- 2. Fix teams SELECT policy — use SECURITY DEFINER function instead of direct team_members query
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
CREATE POLICY "Team members can view their team"
  ON teams FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    public.is_team_member(id, auth.uid())
  );
