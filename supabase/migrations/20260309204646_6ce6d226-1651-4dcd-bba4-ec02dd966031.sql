-- INSERT: team members can create projects for owner
CREATE POLICY "Team members can insert projects for owner"
ON public.projects
FOR INSERT
TO public
WITH CHECK (user_id = get_team_owner_id(auth.uid()));

-- UPDATE: team members can update owner projects
CREATE POLICY "Team members can update owner projects"
ON public.projects
FOR UPDATE
TO public
USING (user_id = get_team_owner_id(auth.uid()));