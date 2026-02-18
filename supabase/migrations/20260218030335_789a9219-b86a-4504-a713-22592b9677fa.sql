
-- Create procurement_order_requests table
CREATE TABLE public.procurement_order_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL,
  submitted_by uuid NOT NULL,
  status       text NOT NULL DEFAULT 'pending',
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Create procurement_order_request_items table
CREATE TABLE public.procurement_order_request_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_request_id     uuid NOT NULL REFERENCES public.procurement_order_requests(id) ON DELETE CASCADE,
  procurement_item_id  uuid NOT NULL,
  quantity             integer NOT NULL DEFAULT 1,
  unit_price           numeric NOT NULL DEFAULT 0,
  item_name            text NOT NULL,
  item_image_url       text,
  item_source_url      text,
  item_source_store    text,
  owner_decision       text,
  owner_notes          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procurement_order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_order_request_items ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER update_procurement_order_requests_updated_at
  BEFORE UPDATE ON public.procurement_order_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: get team_id for a user (either as owner or member)
CREATE OR REPLACE FUNCTION public.get_user_team_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id
  FROM public.teams t
  WHERE t.owner_id = p_user_id
  UNION ALL
  SELECT tm.team_id
  FROM public.team_members tm
  WHERE tm.user_id = p_user_id
  LIMIT 1
$$;

-- Helper: check if the current user is the owner of a given team
CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = p_team_id AND t.owner_id = p_user_id
  )
$$;

-- RLS: procurement_order_requests
-- Submitter can see and insert their own
CREATE POLICY "PMs can insert their own order requests"
  ON public.procurement_order_requests
  FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "PMs can view their own order requests"
  ON public.procurement_order_requests
  FOR SELECT
  USING (auth.uid() = submitted_by);

-- Owner can view and update all requests for their team
CREATE POLICY "Owners can view team order requests"
  ON public.procurement_order_requests
  FOR SELECT
  USING (public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "Owners can update team order requests"
  ON public.procurement_order_requests
  FOR UPDATE
  USING (public.is_team_owner(team_id, auth.uid()));

-- RLS: procurement_order_request_items
CREATE POLICY "PMs can insert their own order request items"
  ON public.procurement_order_request_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.procurement_order_requests r
      WHERE r.id = order_request_id AND r.submitted_by = auth.uid()
    )
  );

CREATE POLICY "PMs can view their own order request items"
  ON public.procurement_order_request_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_order_requests r
      WHERE r.id = order_request_id AND r.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Owners can view team order request items"
  ON public.procurement_order_request_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_order_requests r
      WHERE r.id = order_request_id AND public.is_team_owner(r.team_id, auth.uid())
    )
  );

CREATE POLICY "Owners can update team order request items"
  ON public.procurement_order_request_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_order_requests r
      WHERE r.id = order_request_id AND public.is_team_owner(r.team_id, auth.uid())
    )
  );
