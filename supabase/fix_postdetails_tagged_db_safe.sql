-- Rectification DB (safe) pour erreurs 400 sur PostDetails après publication/tag
-- Objectifs :
-- 1) Garantir les colonnes attendues par le front sur categories/sub_categories/posts
-- 2) Garantir tagged_post_id (FK + index) pour l'affichage de l'annonce taguée
-- 3) Backfill léger des slugs si colonnes ajoutées mais vides
--
-- A exécuter dans le SQL Editor Supabase (projet concerné).

begin;

-- =========================
-- 1) CATEGORIES
-- =========================
alter table if exists public.categories
  add column if not exists name text;

alter table if exists public.categories
  add column if not exists slug text;

alter table if exists public.categories
  add column if not exists icon text;

alter table if exists public.categories
  add column if not exists color text;

-- Backfill slug depuis name si slug absent/vide
update public.categories
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        coalesce(name, ''),
        '[àáâäãå]', 'a', 'gi'
      ),
      '[èéêë]', 'e', 'gi'
    ),
    '[^a-z0-9]+', '-', 'gi'
  )
)
where (slug is null or btrim(slug) = '')
  and name is not null;

-- Nettoyage simple des doubles tirets / bornes
update public.categories
set slug = trim(both '-' from regexp_replace(slug, '-{2,}', '-', 'g'))
where slug is not null;

create index if not exists idx_categories_slug on public.categories (slug);

-- =========================
-- 2) SUB_CATEGORIES
-- =========================
alter table if exists public.sub_categories
  add column if not exists name text;

alter table if exists public.sub_categories
  add column if not exists slug text;

-- category_id est normalement en UUID (FK -> categories.id)
-- On ne force pas ici le type pour éviter une migration destructrice si schéma ancien.
alter table if exists public.sub_categories
  add column if not exists category_id uuid;

-- Backfill slug depuis name si slug absent/vide
update public.sub_categories
set slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        coalesce(name, ''),
        '[àáâäãå]', 'a', 'gi'
      ),
      '[èéêë]', 'e', 'gi'
    ),
    '[^a-z0-9]+', '-', 'gi'
  )
)
where (slug is null or btrim(slug) = '')
  and name is not null;

update public.sub_categories
set slug = trim(both '-' from regexp_replace(slug, '-{2,}', '-', 'g'))
where slug is not null;

create index if not exists idx_sub_categories_slug on public.sub_categories (slug);
create index if not exists idx_sub_categories_category_slug on public.sub_categories (category_id, slug);

-- =========================
-- 3) POSTS (colonnes utilisées par PostDetails + annonce taguée)
-- =========================
alter table if exists public.posts
  add column if not exists likes_count integer not null default 0;

alter table if exists public.posts
  add column if not exists comments_count integer not null default 0;

alter table if exists public.posts
  add column if not exists delivery_available boolean not null default false;

alter table if exists public.posts
  add column if not exists views_count integer not null default 0;

-- Relation vers une annonce taguée
alter table if exists public.posts
  add column if not exists tagged_post_id uuid;

create index if not exists idx_posts_tagged_post_id on public.posts (tagged_post_id);
create index if not exists idx_posts_category_id on public.posts (category_id);
create index if not exists idx_posts_sub_category_id on public.posts (sub_category_id);

-- FK tagged_post_id -> posts.id (si absente)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_tagged_post_id_fkey'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_tagged_post_id_fkey
      foreign key (tagged_post_id)
      references public.posts(id)
      on delete set null;
  end if;
exception
  when undefined_column then
    raise notice 'Impossible de créer FK posts_tagged_post_id_fkey: colonne/tag table absente.';
  when datatype_mismatch then
    raise notice 'Impossible de créer FK posts_tagged_post_id_fkey: type incompatible (tagged_post_id non uuid ?).';
end $$;

-- =========================
-- 4) Diagnostics utiles (résultats affichés en sortie)
-- =========================

-- Colonnes présentes (pour vérifier les causes des 400)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('categories', 'sub_categories', 'posts')
  and column_name in (
    'id', 'name', 'slug', 'category_id', 'sub_category_id',
    'tagged_post_id', 'likes_count', 'comments_count', 'delivery_available', 'views_count'
  )
order by table_name, ordinal_position;

-- Valeurs de tag invalides (tag pointe vers une annonce inexistante)
select p.id as post_id, p.tagged_post_id
from public.posts p
left join public.posts t on t.id = p.tagged_post_id
where p.tagged_post_id is not null
  and t.id is null
limit 50;

-- Doublons de slug (peuvent casser la logique de mapping slug <-> catégorie)
select slug, count(*) as n
from public.categories
where slug is not null and btrim(slug) <> ''
group by slug
having count(*) > 1
order by n desc, slug;

select category_id, slug, count(*) as n
from public.sub_categories
where slug is not null and btrim(slug) <> ''
group by category_id, slug
having count(*) > 1
order by n desc, slug;

commit;

-- Si vos colonnes posts.category_id / posts.sub_category_id / posts.tagged_post_id sont en TEXT
-- (ancien schéma), il faudra une migration de conversion TEXT -> UUID (avec mapping slug -> UUID).
-- Je peux fournir cette migration séparément après le diagnostic.
