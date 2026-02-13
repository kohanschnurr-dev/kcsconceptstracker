
CREATE OR REPLACE FUNCTION public.accept_pending_invitations(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT id, team_id
    FROM public.team_invitations
    WHERE email = lower(p_email)
      AND status = 'pending'
  LOOP
    -- Add user to team if not already a member
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (inv.team_id, p_user_id, 'member')
    ON CONFLICT DO NOTHING;

    -- Mark invitation as accepted
    UPDATE public.team_invitations
    SET status = 'accepted'
    WHERE id = inv.id;
  END LOOP;
END;
$$;
