-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can upload bundle covers" ON storage.objects;

-- Create a simpler policy that allows any authenticated user to upload
CREATE POLICY "Users can upload bundle covers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bundle-covers' AND auth.role() = 'authenticated');

-- Also allow authenticated users to update their uploads
CREATE POLICY "Users can update bundle covers"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'bundle-covers' AND auth.role() = 'authenticated');