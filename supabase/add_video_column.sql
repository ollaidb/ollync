-- Ajout de la colonne video sur posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS video TEXT;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name = 'video';
