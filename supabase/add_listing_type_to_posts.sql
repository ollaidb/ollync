-- Ajoute listing_type aux posts et met a jour la vue publique

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20);

-- Valeur par defaut pour les posts existants
UPDATE posts
SET listing_type = 'offer'
WHERE listing_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_listing_type_created_at
  ON posts (listing_type, created_at DESC);

-- Recréer la vue pour éviter les erreurs de renommage de colonnes
DROP VIEW IF EXISTS public_posts_with_relations;

CREATE VIEW public_posts_with_relations AS
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
