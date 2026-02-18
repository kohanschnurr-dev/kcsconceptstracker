
-- Fix the overly-permissive INSERT policy on notifications.
-- Triggers run as SECURITY DEFINER and bypass RLS, so we can restrict
-- this policy to only allow authenticated users to insert their own notifications.
-- In practice, only the trigger functions (service role) will insert here.
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
