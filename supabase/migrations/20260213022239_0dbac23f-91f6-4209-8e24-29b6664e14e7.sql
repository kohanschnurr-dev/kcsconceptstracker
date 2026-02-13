
-- Table to store which permissions each role has within a team
CREATE TABLE public.team_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role text NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, role, permission)
);

-- Enable RLS
ALTER TABLE public.team_role_permissions ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Team owner can manage role permissions"
ON public.team_role_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_role_permissions.team_id
      AND teams.owner_id = auth.uid()
  )
);

-- Team members can read their team's permissions
CREATE POLICY "Team members can view role permissions"
ON public.team_role_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_role_permissions.team_id
      AND team_members.user_id = auth.uid()
  )
);

-- Seed default permissions for all existing teams
-- Project Manager gets all permissions
INSERT INTO public.team_role_permissions (team_id, role, permission)
SELECT t.id, 'manager', p.permission
FROM public.teams t
CROSS JOIN (
  VALUES 
    ('view_projects'), ('edit_projects'), ('manage_expenses'),
    ('manage_vendors'), ('manage_procurement'), ('manage_budgets'),
    ('manage_calendar'), ('view_reports'), ('manage_documents')
) AS p(permission)
ON CONFLICT DO NOTHING;

-- Viewer gets view-only permissions
INSERT INTO public.team_role_permissions (team_id, role, permission)
SELECT t.id, 'viewer', p.permission
FROM public.teams t
CROSS JOIN (
  VALUES ('view_projects'), ('view_reports')
) AS p(permission)
ON CONFLICT DO NOTHING;
