
-- Junction table for many-to-many vendor-folder assignments
CREATE TABLE public.vendor_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.vendor_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, folder_id)
);

ALTER TABLE public.vendor_folder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vendor folder assignments"
  ON public.vendor_folder_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_folder_assignments.vendor_id AND v.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_folder_assignments.vendor_id AND v.user_id = auth.uid()));

-- Migrate existing data from folder_id column
INSERT INTO public.vendor_folder_assignments (vendor_id, folder_id)
SELECT id, folder_id FROM public.vendors WHERE folder_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop old column
ALTER TABLE public.vendors DROP COLUMN IF EXISTS folder_id;
