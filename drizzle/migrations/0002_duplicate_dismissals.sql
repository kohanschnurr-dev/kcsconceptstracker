CREATE TABLE public.duplicate_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  record_a text NOT NULL,
  record_b text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_a, record_b)
);
GRANT SELECT, INSERT, DELETE ON public.duplicate_dismissals TO authenticated;
GRANT ALL ON public.duplicate_dismissals TO service_role;
ALTER TABLE public.duplicate_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dismissals select" ON public.duplicate_dismissals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own dismissals insert" ON public.duplicate_dismissals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own dismissals delete" ON public.duplicate_dismissals FOR DELETE TO authenticated USING (user_id = auth.uid());