-- Ajout de la colonne tagged_post_id pour lier une annonce
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS tagged_post_id UUID;

-- Index pour les recherches/joins
CREATE INDEX IF NOT EXISTS idx_posts_tagged_post_id
  ON posts(tagged_post_id);

-- Contrainte FK vers posts
ALTER TABLE posts
  ADD CONSTRAINT posts_tagged_post_id_fkey
  FOREIGN KEY (tagged_post_id)
  REFERENCES posts(id)
  ON DELETE SET NULL;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name = 'tagged_post_id';
