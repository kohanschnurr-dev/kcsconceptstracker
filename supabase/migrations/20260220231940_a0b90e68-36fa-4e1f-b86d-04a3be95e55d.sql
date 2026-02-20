
-- Create task-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-photos' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Task photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own task photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-photos' AND auth.uid() IS NOT NULL);
