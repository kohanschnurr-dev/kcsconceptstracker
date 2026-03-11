
-- Create vendor_folders table
CREATE TABLE public.vendor_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#f59e0b',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vendor folders" ON public.vendor_folders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add folder_id to vendors
ALTER TABLE public.vendors ADD COLUMN folder_id uuid REFERENCES public.vendor_folders(id) ON DELETE SET NULL;
