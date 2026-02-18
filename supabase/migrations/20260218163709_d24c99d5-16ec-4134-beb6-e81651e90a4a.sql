
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat',
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support messages"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
