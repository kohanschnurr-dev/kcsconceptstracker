-- Project-scoped messages table
-- Separate from owner_messages (which is PM→Owner direct thread)
-- This table supports project-level chat threads linked to a project_id

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sender_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID        REFERENCES public.projects(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  is_read     BOOLEAN     NOT NULL DEFAULT false
);

-- Efficient lookups by project and time
CREATE INDEX IF NOT EXISTS messages_project_created_idx
  ON public.messages (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx
  ON public.messages (sender_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: team members of the project can read its messages
CREATE POLICY "Project team members can read messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.teams t ON t.id = tm.team_id
      JOIN public.projects p ON p.user_id = t.owner_id
      WHERE tm.user_id = auth.uid()
        AND p.id = messages.project_id
    )
  );

-- Policy: authenticated users can insert their own messages
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: sender can update is_read on their own messages
CREATE POLICY "Sender can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Trigger: insert notification when a project message is sent
-- Notifies the project owner of a new message
CREATE OR REPLACE FUNCTION public.notify_on_project_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project       RECORD;
  v_actor_profile RECORD;
BEGIN
  -- Fetch project owner
  SELECT user_id, name INTO v_project
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Don't notify if the sender IS the owner
  IF v_project.user_id IS NULL OR v_project.user_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  -- Fetch actor name
  SELECT
    COALESCE(NULLIF(TRIM(first_name || ' ' || COALESCE(last_name, '')), ''), 'Someone') AS display_name
  INTO v_actor_profile
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  INSERT INTO public.notifications (
    owner_id,
    actor_id,
    event_type,
    entity_id,
    payload
  ) VALUES (
    v_project.user_id,
    NEW.sender_id,
    'direct_message',
    NEW.id,
    jsonb_build_object(
      'actorName',     COALESCE(v_actor_profile.display_name, 'Someone'),
      'messagePreview', LEFT(NEW.content, 80),
      'projectId',     NEW.project_id,
      'projectName',   COALESCE(v_project.name, 'Project')
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_project_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_on_project_message();
