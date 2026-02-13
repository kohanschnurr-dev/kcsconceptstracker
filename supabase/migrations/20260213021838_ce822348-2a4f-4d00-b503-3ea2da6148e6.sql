DROP POLICY IF EXISTS "Invited users can view their invitation" ON team_invitations;

CREATE POLICY "Invited users can view their invitation"
  ON team_invitations
  FOR SELECT
  USING (lower(email) = lower(auth.email()));