-- ============================================
-- CORRECTION DE LA COLONNE CONTENT DANS POSTS
-- ============================================
-- Script pour corriger le problème de la colonne content NOT NULL
-- Exécutez ce script dans votre SQL Editor Supabase

-- Étape 1 : Mettre à jour tous les posts existants où content est NULL
-- en copiant la valeur de description
UPDATE posts
SET content = description
WHERE content IS NULL AND description IS NOT NULL;

-- Étape 2 : Pour les posts où description est aussi NULL, mettre une valeur par défaut
UPDATE posts
SET content = COALESCE(description, title, 'Aucune description')
WHERE content IS NULL;

-- Étape 3 : Rendre la colonne content nullable (recommandé)
DO $$
BEGIN
  -- Vérifier si la colonne content existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'content'
  ) THEN
    -- Rendre la colonne nullable
    ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;
    RAISE NOTICE 'Contrainte NOT NULL retirée de la colonne content';
  END IF;
END $$;

-- Étape 4 : S'assurer que description existe et est NOT NULL
DO $$
BEGIN
  -- Vérifier si description existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'description'
  ) THEN
    -- Mettre à jour les valeurs NULL de description
    UPDATE posts SET description = COALESCE(content, title, 'Aucune description') WHERE description IS NULL;
    
    -- Rendre description NOT NULL si elle ne l'est pas déjà
    BEGIN
      ALTER TABLE posts ALTER COLUMN description SET NOT NULL;
      RAISE NOTICE 'Colonne description rendue NOT NULL';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Description est déjà NOT NULL ou erreur: %', SQLERRM;
    END;
  ELSE
    -- Si description n'existe pas, la créer
    ALTER TABLE posts ADD COLUMN description TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Colonne description créée';
  END IF;
END $$;

-- Étape 5 : Vérification
-- Afficher les colonnes de la table posts
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name IN ('content', 'description')
ORDER BY column_name;

-- Afficher le nombre de posts avec content NULL (devrait être 0 après correction)
SELECT 
  COUNT(*) as posts_with_null_content
FROM posts
WHERE content IS NULL;

-- Afficher le nombre de posts avec description NULL (devrait être 0)
SELECT 
  COUNT(*) as posts_with_null_description
FROM posts
WHERE description IS NULL;

