CREATE TABLE public.gantt_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  collapsed_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gantt_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gantt preferences"
  ON public.gantt_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gantt preferences"
  ON public.gantt_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gantt preferences"
  ON public.gantt_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gantt preferences"
  ON public.gantt_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gantt_preferences_updated_at
  BEFORE UPDATE ON public.gantt_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();