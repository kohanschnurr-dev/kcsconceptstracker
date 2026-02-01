-- Create storage bucket for procurement item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('procurement-images', 'procurement-images', true);

-- RLS policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload procurement images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'procurement-images');

-- RLS policy for authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can manage procurement images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'procurement-images');

CREATE POLICY "Authenticated users can delete procurement images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'procurement-images');

-- Public read access
CREATE POLICY "Public read access for procurement images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'procurement-images');