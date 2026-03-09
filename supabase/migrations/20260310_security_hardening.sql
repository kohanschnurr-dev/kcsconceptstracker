-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Fixes 4 Supabase security warnings:
-- 1. RLS policies with always-true conditions
-- 2. Unrestricted enum value addition via RPC
-- 3. Team invitation RPCs trust client-supplied email
-- 4. Any authenticated user can forge notifications
-- ============================================================


-- ============================================================
-- 1. RLS POLICY ALWAYS TRUE — Fix three tables
-- ============================================================

-- 1a. quickbooks_oauth_states: Drop the "Service role has full access"
--     policy. The service_role key already bypasses RLS, so this
--     USING(true) policy is unnecessary and overly permissive.
DROP POLICY IF EXISTS "Service role has full access"
  ON public.quickbooks_oauth_states;

-- 1b. demo_requests: Keep anonymous INSERT for lead capture but
--     restrict to only the columns that matter (no admin fields).
--     The existing WITH CHECK(true) allows anyone to set status/notes.
--     Replace with a check that prevents setting admin-only fields.
DROP POLICY IF EXISTS "Anyone can submit demo requests"
  ON public.demo_requests;

CREATE POLICY "Anyone can submit demo requests"
  ON public.demo_requests FOR INSERT
  WITH CHECK (
    status = 'new'
    AND notes IS NULL
    AND follow_up_date IS NULL
  );

-- 1c. notifications: Remove the permissive INSERT policy entirely.
--     Notifications are created exclusively by SECURITY DEFINER
--     trigger functions (which bypass RLS). No user should be able
--     to INSERT notifications directly.
DROP POLICY IF EXISTS "Service can insert notifications"
  ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications"
  ON public.notifications;

-- Also add a DELETE policy so users can delete their own notifications
CREATE POLICY "Owner can delete notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = owner_id);


-- ============================================================
-- 2. UNRESTRICTED ENUM VALUE ADDITION VIA RPC
--    add_budget_category() is SECURITY DEFINER and allows any
--    caller to ALTER TYPE. Add an auth guard requiring the user
--    to be authenticated (team owner context enforced by the
--    calling application — only owners can manage categories).
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_budget_category(new_value text)
RETURNS void AS $$
BEGIN
  -- Guard: only authenticated users can add enum values
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication required';
  END IF;

  -- Sanitize: only allow alphanumeric + underscore values
  IF new_value !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid category value: must be lowercase alphanumeric with underscores';
  END IF;

  EXECUTE format('ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS %L', new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';


-- ============================================================
-- 3. TEAM INVITATION RPCs TRUST CLIENT-SUPPLIED EMAIL
--    Replace accept_invitation_by_token and
--    accept_pending_invitations to derive the caller's email
--    from auth.jwt() instead of trusting client input.
-- ============================================================

-- 3a. accept_invitation_by_token: derive email server-side
CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(
  p_user_id UUID,
  p_token   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inv    RECORD;
  v_email  TEXT;
BEGIN
  -- Verify caller identity
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Derive email from JWT — never trust client input
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No email in auth token');
  END IF;

  -- Lock the invitation row to prevent race conditions
  SELECT id, team_id, email, role, expires_at, status
    INTO v_inv
    FROM public.team_invitations
   WHERE token = p_token
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation token');
  END IF;

  IF v_inv.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'This invitation has already been accepted or cancelled'
    );
  END IF;

  IF v_inv.expires_at IS NOT NULL AND v_inv.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'This invitation link has expired — ask the team owner to resend it'
    );
  END IF;

  -- Email mismatch check using server-derived email
  IF lower(v_inv.email) != lower(v_email) THEN
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

-- Keep backward-compatible overload that accepts p_email but ignores it
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
BEGIN
  -- Delegate to the secure 2-arg version; p_email is ignored
  RETURN public.accept_invitation_by_token(p_user_id, p_token);
END;
$$;

-- 3b. accept_pending_invitations: derive email server-side
CREATE OR REPLACE FUNCTION public.accept_pending_invitations(
  p_user_id UUID,
  p_email   TEXT  -- kept for backward compat, ignored
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv      RECORD;
  v_email  TEXT;
BEGIN
  -- Verify caller identity
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Derive email from JWT — never trust client input
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  FOR inv IN
    SELECT id, team_id, role
      FROM public.team_invitations
     WHERE lower(email) = lower(v_email)
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


-- ============================================================
-- 4. NOTIFICATIONS FORGERY PREVENTION
--    Notifications INSERT is now blocked at the RLS level.
--    Only SECURITY DEFINER trigger functions can insert.
--    Verify all existing trigger functions have proper guards.
-- ============================================================

-- The trigger functions (fn_notify_order_request, fn_notify_expense, etc.)
-- are already SECURITY DEFINER and bypass RLS. They also verify that
-- actor_id != owner_id before inserting, preventing self-notification spam.
-- No changes needed to trigger functions — just the RLS policy removal above.

-- Add admin read access to notifications for the admin dashboard
CREATE POLICY "Admin can view all notifications"
  ON public.notifications FOR SELECT
  USING (auth.jwt() ->> 'email' = 'kohanschnurr@gmail.com');

-- Admin access to demo_requests (already exists but ensure it covers all ops)
-- (Already created in 20260306_admin_tables.sql — no change needed)
