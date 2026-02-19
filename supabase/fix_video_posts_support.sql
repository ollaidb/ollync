-- =========================================================
-- Fix video support for posts (publish + read)
-- Idempotent patch
-- =========================================================

BEGIN;

-- 1) Ensure posts.video exists
ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS video text;

-- 2) Ensure public projection view includes video
DROP VIEW IF EXISTS public.public_posts_with_relations;

CREATE VIEW public.public_posts_with_relations AS
SELECT
  p.id,
  p.user_id,
  p.category_id,
  p.sub_category_id,
  p.listing_type,
  p.title,
  p.description,
  p.price,
  p.payment_type,
  p.location,
  p.images,
  p.video,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.needed_date,
  p.number_of_people,
  p.delivery_available,
  p.is_urgent,
  p.status,
  jsonb_build_object(
    'id', pr.id,
    'username', pr.username,
    'full_name', pr.full_name,
    'avatar_url', pr.avatar_url
  ) AS profiles,
  jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug
  ) AS categories
FROM public.posts p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
LEFT JOIN public.categories c ON c.id = p.category_id;

GRANT SELECT ON public.public_posts_with_relations TO anon, authenticated;

-- 3) Ensure videos bucket exists and accepts common web formats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Access videos" ON storage.objects;
CREATE POLICY "Public Access videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;
