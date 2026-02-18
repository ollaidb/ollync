-- =========================================================
-- Fix missing behavioral tables used by Home recommendations
-- Prevents 404 on /rest/v1/favorites and /rest/v1/interests
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------
-- FAVORITES TABLE
-- ----------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON public.favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

CREATE POLICY "Anyone can view favorites"
  ON public.favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------
-- INTERESTS TABLE
-- ---------------
CREATE TABLE IF NOT EXISTS public.interests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_interests_user_id ON public.interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_post_id ON public.interests(post_id);
CREATE INDEX IF NOT EXISTS idx_interests_created_at ON public.interests(created_at DESC);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interests" ON public.interests;
DROP POLICY IF EXISTS "Users can create their own interests" ON public.interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON public.interests;
DROP POLICY IF EXISTS "Post owners can view interests on their posts" ON public.interests;

CREATE POLICY "Users can view their own interests"
  ON public.interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interests"
  ON public.interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests"
  ON public.interests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Post owners can view interests on their posts"
  ON public.interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = interests.post_id
        AND p.user_id = auth.uid()
    )
  );

-- ---------------
-- SAVED_SEARCHES (optional but queried in Home)
-- ---------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_query text,
  filters jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_updated
  ON public.saved_searches(user_id, updated_at DESC);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can create their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches;

CREATE POLICY "Users can view their own saved searches"
  ON public.saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
  ON public.saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON public.saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON public.saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at for saved_searches
CREATE OR REPLACE FUNCTION public.update_saved_searches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_saved_searches_updated_at ON public.saved_searches;
CREATE TRIGGER trigger_update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_searches_updated_at();

COMMIT;
