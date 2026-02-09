
CREATE TABLE public.project_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  foundation_status text,
  gas_electric text,
  roof_year text,
  roof_type text,
  hvac_year text,
  hvac_condenser text,
  hvac_furnace text,
  drain_line_material text,
  window_status text,
  electrical_status text,
  plumbing_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE public.project_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project info" ON public.project_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own project info" ON public.project_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own project info" ON public.project_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own project info" ON public.project_info FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_project_info_updated_at BEFORE UPDATE ON public.project_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
