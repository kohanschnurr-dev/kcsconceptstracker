ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');

CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(p_user_id uuid, p_email text, p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT * INTO v_inv FROM team_invitations
    WHERE token = p_token AND email = p_email AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_inv.team_id, p_user_id, v_inv.role)
    ON CONFLICT DO NOTHING;
  UPDATE team_invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN jsonb_build_object('success', true);
END;
$$;