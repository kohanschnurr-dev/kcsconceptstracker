-- ============================================================
-- Team Invitations: Add secure token, expiry, and role fields
-- ============================================================

-- 1. Extend team_invitations with the three new columns
ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS token      TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'viewer';

-- 2. Unique, partial index for fast & safe token lookups
--    (partial so NULL tokens don't conflict with each other)
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_token
  ON public.team_invitations(token)
  WHERE token IS NOT NULL;

-- ============================================================
-- 3. accept_invitation_by_token
--    Called after sign-in/sign-up when a user arrives via an
--    invite link (/auth?invite_token=...).
--
--    Guarantees atomicity:  the team_members insert and the
--    invitation status update happen in the same transaction,
--    and a row-level lock prevents double-acceptance.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(
  p_user_id UUID,
  p_email   TEXT,
  p_token   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  -- Lock the row so a race between two simultaneous sessions
  -- can't result in both reading status = 'pending'.
  SELECT id, team_id, email, role, expires_at, status
    INTO v_inv
    FROM public.team_invitations
   WHERE token = p_token
     FOR UPDATE;

  -- Token not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Invalid invitation token'
    );
  END IF;

  -- Already used or cancelled
  IF v_inv.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'This invitation has already been accepted or cancelled'
    );
  END IF;

  -- Expired
  IF v_inv.expires_at IS NOT NULL AND v_inv.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'This invitation link has expired — ask the team owner to resend it'
    );
  END IF;

  -- Email mismatch (security: ensure the authenticated user
  -- is the person the invite was intended for)
  IF lower(v_inv.email) != lower(p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'This invitation was sent to a different email address'
    );
  END IF;

  -- Atomic: add to team + mark accepted
  INSERT INTO public.team_members (team_id, user_id, role, joined_at)
  VALUES (v_inv.team_id, p_user_id, COALESCE(v_inv.role, 'viewer'), now())
  ON CONFLICT (team_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE public.team_invitations
     SET status = 'accepted'
   WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'success', true,
    'team_id', v_inv.team_id,
    'role',    v_inv.role
  );
END;
$$;

-- ============================================================
-- 4. Rebuild accept_pending_invitations (email-based fallback)
--    Now respects expiry dates and uses the role stored on
--    each invitation row instead of the hardcoded 'member'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_pending_invitations(
  p_user_id UUID,
  p_email   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT id, team_id, role
      FROM public.team_invitations
     WHERE lower(email) = lower(p_email)
       AND status = 'pending'
       AND (expires_at IS NULL OR expires_at > now())
  LOOP
    INSERT INTO public.team_members (team_id, user_id, role, joined_at)
    VALUES (inv.team_id, p_user_id, COALESCE(inv.role, 'viewer'), now())
    ON CONFLICT (team_id, user_id) DO NOTHING;

    UPDATE public.team_invitations
       SET status = 'accepted'
     WHERE id = inv.id;
  END LOOP;
END;
$$;
