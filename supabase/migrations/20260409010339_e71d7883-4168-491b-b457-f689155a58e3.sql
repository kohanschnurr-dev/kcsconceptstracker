CREATE TABLE public.loan_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  extension_number int NOT NULL DEFAULT 1,
  extended_from date NOT NULL,
  extended_to date NOT NULL,
  extension_fee numeric DEFAULT 0,
  fee_percentage numeric DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loan_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loan extensions"
  ON public.loan_extensions FOR ALL TO authenticated
  USING (loan_id IN (SELECT id FROM public.loans WHERE user_id = auth.uid()))
  WITH CHECK (loan_id IN (SELECT id FROM public.loans WHERE user_id = auth.uid()));

CREATE POLICY "Team members can view owner loan extensions"
  ON public.loan_extensions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = loan_extensions.loan_id
    AND l.user_id = get_team_owner_id(auth.uid())
  ));