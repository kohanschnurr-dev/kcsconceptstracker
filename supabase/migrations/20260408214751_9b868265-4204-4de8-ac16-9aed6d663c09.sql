
-- 1. Harden accept_invitation_by_token: derive user_id and email from auth
CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_email text;
  v_inv RECORD;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO v_caller_email FROM auth.users WHERE id = v_caller_id;

  SELECT * INTO v_inv FROM team_invitations
    WHERE token = p_token AND lower(email) = lower(v_caller_email) AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_inv.team_id, v_caller_id, v_inv.role)
    ON CONFLICT DO NOTHING;

  UPDATE team_invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 2. Harden accept_pending_invitations: derive user_id and email from auth
CREATE OR REPLACE FUNCTION public.accept_pending_invitations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_email text;
  inv RECORD;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_caller_email FROM auth.users WHERE id = v_caller_id;

  FOR inv IN
    SELECT id, team_id, role
    FROM public.team_invitations
    WHERE lower(email) = lower(v_caller_email)
      AND status = 'pending'
  LOOP
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (inv.team_id, v_caller_id, COALESCE(inv.role, 'member'))
    ON CONFLICT DO NOTHING;

    UPDATE public.team_invitations
    SET status = 'accepted'
    WHERE id = inv.id;
  END LOOP;
END;
$function$;

-- 3. Restrict add_budget_category to account owners only
CREATE OR REPLACE FUNCTION public.add_budget_category(new_value text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only account owners can add budget categories';
  END IF;

  EXECUTE format('ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS %L', new_value);
END;
$function$;

-- 4. Drop overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
