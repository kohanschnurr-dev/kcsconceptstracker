-- Add cover_image_url column to procurement_bundles
ALTER TABLE public.procurement_bundles 
ADD COLUMN cover_image_url TEXT;

-- Create storage bucket for bundle cover images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bundle-covers', 'bundle-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload bundle covers
CREATE POLICY "Users can upload bundle covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bundle-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view bundle covers
CREATE POLICY "Bundle covers are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bundle-covers');

-- Allow users to delete their own bundle covers
CREATE POLICY "Users can delete their own bundle covers"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bundle-covers' AND auth.uid()::text = (storage.foldername(name))[1]);