-- Security + projection for posts
-- Creates a public view with minimal related data and safe RLS policies

-- 1) Enable RLS on posts if not already enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2) Create policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'public_can_read_active_posts'
  ) THEN
    CREATE POLICY "public_can_read_active_posts" ON posts
      FOR SELECT
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'users_can_insert_own_posts'
  ) THEN
    CREATE POLICY "users_can_insert_own_posts" ON posts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'users_can_update_own_posts'
  ) THEN
    CREATE POLICY "users_can_update_own_posts" ON posts
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'users_can_delete_own_posts'
  ) THEN
    CREATE POLICY "users_can_delete_own_posts" ON posts
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 3) Create or replace the projection view
CREATE OR REPLACE VIEW public_posts_with_relations AS
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
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN categories c ON c.id = p.category_id;
