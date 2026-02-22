-- =========================================================
-- HOTFIX PROD - Emploi non visible + erreurs posts/categories
-- Idempotent: peut etre execute plusieurs fois
-- =========================================================

begin;

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1) Colonnes attendues par le front (posts + profiles)
-- ---------------------------------------------------------
alter table if exists public.posts add column if not exists video text;
alter table if exists public.posts add column if not exists location_address text;
alter table if exists public.posts add column if not exists location_city text;
alter table if exists public.posts add column if not exists location_lat double precision;
alter table if exists public.posts add column if not exists location_lng double precision;
alter table if exists public.posts add column if not exists location_visible_to_participants_only boolean default false;
alter table if exists public.posts add column if not exists event_mode varchar(20);
alter table if exists public.posts add column if not exists event_platform text;
alter table if exists public.posts add column if not exists needed_time varchar(10);
alter table if exists public.posts add column if not exists duration_minutes integer;

alter table if exists public.profiles add column if not exists show_in_users boolean default true;

-- event_mode check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_event_mode_check'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_event_mode_check
      CHECK (event_mode IS NULL OR event_mode IN ('in_person', 'remote'));
  END IF;
END $$;

-- ---------------------------------------------------------
-- 2) FK utilises par les selects imbriques PostgREST
--    (evite certains 400 sur posts?select=...,profiles(...),categories(...))
-- ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND contype = 'f'
      AND conname = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND contype = 'f'
      AND conname = 'posts_category_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND contype = 'f'
      AND conname = 'posts_sub_category_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_sub_category_id_fkey
      FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------
-- 3) Table ignored_posts manquante (404 en swipe)
-- ---------------------------------------------------------
create table if not exists public.ignored_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);

create index if not exists idx_ignored_posts_user_id on public.ignored_posts(user_id);
create index if not exists idx_ignored_posts_post_id on public.ignored_posts(post_id);

alter table public.ignored_posts enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ignored_posts'
      AND policyname = 'ignored_posts_select_own'
  ) THEN
    CREATE POLICY ignored_posts_select_own ON public.ignored_posts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ignored_posts'
      AND policyname = 'ignored_posts_insert_own'
  ) THEN
    CREATE POLICY ignored_posts_insert_own ON public.ignored_posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ignored_posts'
      AND policyname = 'ignored_posts_delete_own'
  ) THEN
    CREATE POLICY ignored_posts_delete_own ON public.ignored_posts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------
-- 4) Reparer la categorie emploi (slug canonique + migration aliases)
-- ---------------------------------------------------------
DO $$
DECLARE
  v_emploi_id uuid;
  v_alias_id uuid;
  v_alias_slug text;
BEGIN
  -- creer emploi si manquant
  SELECT id INTO v_emploi_id
  FROM public.categories
  WHERE slug = 'emploi'
  LIMIT 1;

  -- fallback: categorie deja presente avec le nom Emploi mais autre slug
  IF v_emploi_id IS NULL THEN
    SELECT id INTO v_emploi_id
    FROM public.categories
    WHERE lower(name) = lower('Emploi')
    LIMIT 1;
  END IF;

  IF v_emploi_id IS NULL THEN
    INSERT INTO public.categories (name, slug, icon, color)
    VALUES ('Emploi', 'emploi', 'Briefcase', '#10b981')
    RETURNING id INTO v_emploi_id;
  ELSE
    UPDATE public.categories
    SET slug = 'emploi',
        icon = COALESCE(icon, 'Briefcase'),
        color = COALESCE(color, '#10b981')
    WHERE id = v_emploi_id;
  END IF;

  -- migrer les anciennes categories alias -> emploi
  FOR v_alias_slug IN SELECT unnest(ARRAY['montage', 'recrutement'])
  LOOP
    SELECT id INTO v_alias_id
    FROM public.categories
    WHERE slug = v_alias_slug
    LIMIT 1;

    IF v_alias_id IS NOT NULL AND v_alias_id <> v_emploi_id THEN
      UPDATE public.posts
      SET category_id = v_emploi_id
      WHERE category_id = v_alias_id;
    END IF;
  END LOOP;

  -- normaliser le libelle
  UPDATE public.categories
  SET name = 'Emploi'
  WHERE id = v_emploi_id;
END $$;

-- ---------------------------------------------------------
-- 5) Vue utilisee pour les listings (inclure video)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- 6) Verification rapide
-- ---------------------------------------------------------
-- categories presentes
-- select id, name, slug from public.categories where slug in ('emploi','montage','recrutement') order by slug;

-- volume posts emploi
-- select c.slug, count(*) from public.posts p join public.categories c on c.id = p.category_id group by c.slug order by c.slug;

commit;
