-- Bucket "videos" + policies RLS pour l'upload vidéo

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Access videos" ON storage.objects;
CREATE POLICY "Public Access videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'videos';
