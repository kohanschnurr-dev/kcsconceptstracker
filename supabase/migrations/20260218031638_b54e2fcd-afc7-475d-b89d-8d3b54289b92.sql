
-- =====================================================
-- NOTIFICATIONS SYSTEM
-- =====================================================

-- Table: notifications
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL,
  actor_id    uuid NOT NULL,
  event_type  text NOT NULL,
  entity_id   uuid,
  payload     jsonb NOT NULL DEFAULT '{}',
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_owner_unread 
  ON public.notifications (owner_id, is_read, created_at DESC);

CREATE POLICY "Owner can view notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can mark notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Table: owner_messages
-- =====================================================
CREATE TABLE public.owner_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL,
  sender_id   uuid NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PMs can send messages" ON public.owner_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Owner can view team messages" ON public.owner_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Sender can view their own messages" ON public.owner_messages
  FOR SELECT USING (auth.uid() = sender_id);

-- =====================================================
-- Helper: get actor display name from profiles
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_actor_display_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
    'A team member'
  )
  FROM public.profiles
  WHERE user_id = p_user_id
  LIMIT 1
$$;

-- =====================================================
-- TRIGGER: Order Request Submitted
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_order_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_name text;
  v_item_count int;
BEGIN
  -- Get the owner of the team
  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = NEW.team_id
  LIMIT 1;

  -- Skip if no owner found or actor is the owner
  IF v_owner_id IS NULL OR v_owner_id = NEW.submitted_by THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(NEW.submitted_by);

  -- Count items in this order request
  SELECT COUNT(*) INTO v_item_count
  FROM public.procurement_order_request_items
  WHERE order_request_id = NEW.id;

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    NEW.submitted_by,
    'order_request',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'itemCount', v_item_count,
      'notes', NEW.notes
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_request
  AFTER INSERT ON public.procurement_order_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_order_request();

-- =====================================================
-- TRIGGER: Expense Logged
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_id uuid;
  v_actor_name text;
  v_project_name text;
BEGIN
  -- Get the project owner
  SELECT p.user_id INTO v_actor_id
  FROM public.projects p
  WHERE p.id = NEW.project_id
  LIMIT 1;

  -- The actor is whoever created the expense — use project user_id from the project
  -- We need to find the team owner for this project owner
  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(v_actor_id))
  LIMIT 1;

  -- Skip if no owner or actor is the owner
  IF v_owner_id IS NULL OR v_owner_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(v_actor_id);

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = NEW.project_id;

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    v_actor_id,
    'expense',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'amount', NEW.amount,
      'projectName', v_project_name,
      'projectId', NEW.project_id,
      'description', NEW.description,
      'vendorName', NEW.vendor_name
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_expense();

-- =====================================================
-- TRIGGER: Daily Log Added
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_daily_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_id uuid;
  v_actor_name text;
  v_project_name text;
BEGIN
  SELECT p.user_id INTO v_actor_id
  FROM public.projects p
  WHERE p.id = NEW.project_id
  LIMIT 1;

  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(v_actor_id))
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(v_actor_id);

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = NEW.project_id;

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    v_actor_id,
    'daily_log',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'projectName', v_project_name,
      'projectId', NEW.project_id,
      'logDate', NEW.date
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_daily_log
  AFTER INSERT ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_daily_log();

-- =====================================================
-- TRIGGER: Task Completed
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_task_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_name text;
  v_project_name text;
BEGIN
  -- Only fire when status transitions to 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(NEW.user_id))
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(NEW.user_id);

  IF NEW.project_id IS NOT NULL THEN
    SELECT name INTO v_project_name
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    NEW.user_id,
    'task_completed',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'taskTitle', NEW.title,
      'projectName', v_project_name,
      'projectId', NEW.project_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_task_completed();

-- =====================================================
-- TRIGGER: Project Note Added
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_project_note()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_id uuid;
  v_actor_name text;
  v_project_name text;
BEGIN
  SELECT p.user_id INTO v_actor_id
  FROM public.projects p
  WHERE p.id = NEW.project_id
  LIMIT 1;

  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(v_actor_id))
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(v_actor_id);

  SELECT name INTO v_project_name
  FROM public.projects
  WHERE id = NEW.project_id;

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    v_actor_id,
    'project_note',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'projectName', v_project_name,
      'projectId', NEW.project_id,
      'contentPreview', LEFT(NEW.content, 100)
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_project_note
  AFTER INSERT ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_project_note();

-- =====================================================
-- TRIGGER: New Project Created
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_project_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_name text;
BEGIN
  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(NEW.user_id))
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(NEW.user_id);

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    NEW.user_id,
    'project_created',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'projectName', NEW.name,
      'projectId', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_project_created();

-- =====================================================
-- TRIGGER: Project Status Changed
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_project_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_name text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = (SELECT public.get_user_team_id(NEW.user_id))
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(NEW.user_id);

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    NEW.user_id,
    'project_status',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'projectName', NEW.name,
      'projectId', NEW.id,
      'newStatus', NEW.status,
      'oldStatus', OLD.status
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_project_status
  AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_project_status();

-- =====================================================
-- TRIGGER: Direct Message to Owner
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_notify_direct_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_actor_name text;
BEGIN
  SELECT t.owner_id INTO v_owner_id
  FROM public.teams t
  WHERE t.id = NEW.team_id
  LIMIT 1;

  IF v_owner_id IS NULL OR v_owner_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  v_actor_name := public.get_actor_display_name(NEW.sender_id);

  INSERT INTO public.notifications (owner_id, actor_id, event_type, entity_id, payload)
  VALUES (
    v_owner_id,
    NEW.sender_id,
    'direct_message',
    NEW.id,
    jsonb_build_object(
      'actorName', v_actor_name,
      'messagePreview', LEFT(NEW.message, 150),
      'fullMessage', NEW.message,
      'teamId', NEW.team_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_direct_message
  AFTER INSERT ON public.owner_messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_direct_message();
