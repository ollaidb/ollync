-- Script pour corriger les contraintes de la table posts
-- Ce script résout deux problèmes :
-- 1. La contrainte check sur media_type qui limite les valeurs acceptées
-- 2. La colonne content qui a une contrainte NOT NULL

-- ============================================
-- ÉTAPE 1 : Supprimer la contrainte check sur media_type
-- ============================================
DO $$
BEGIN
  -- Supprimer la contrainte check si elle existe
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'posts_media_type_check'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_media_type_check;
    RAISE NOTICE 'Contrainte posts_media_type_check supprimée';
  ELSE
    RAISE NOTICE 'Contrainte posts_media_type_check n''existe pas';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : Augmenter la taille de media_type si nécessaire
-- ============================================
-- Les noms de réseaux sociaux peuvent être plus longs que 20 caractères
DO $$
BEGIN
  -- Vérifier la taille actuelle de media_type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'media_type'
      AND character_maximum_length < 50
  ) THEN
    ALTER TABLE posts ALTER COLUMN media_type TYPE VARCHAR(50);
    RAISE NOTICE 'Taille de media_type augmentée à 50 caractères';
  ELSE
    RAISE NOTICE 'Taille de media_type déjà suffisante';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : Corriger les posts existants avec content NULL
-- ============================================
-- Mettre à jour tous les posts où content est NULL
UPDATE posts
SET content = description
WHERE content IS NULL AND description IS NOT NULL;

-- Pour les posts où description est aussi NULL, mettre une valeur par défaut
UPDATE posts
SET content = COALESCE(description, title, '')
WHERE content IS NULL;

-- ============================================
-- ÉTAPE 4 : Rendre la colonne content nullable
-- ============================================
DO $$
BEGIN
  -- Vérifier si content existe et est NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'content'
      AND is_nullable = 'NO'
  ) THEN
    -- Rendre la colonne nullable
    ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;
    RAISE NOTICE 'Colonne content rendue nullable';
  ELSE
    RAISE NOTICE 'Colonne content déjà nullable ou n''existe pas';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : S'assurer que description est NOT NULL
-- ============================================
DO $$
BEGIN
  -- Vérifier si description existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'description'
  ) THEN
    -- S'assurer que description est NOT NULL
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'description'
        AND is_nullable = 'YES'
    ) THEN
      -- Mettre une valeur par défaut pour les NULL existants
      UPDATE posts SET description = COALESCE(description, title, '') WHERE description IS NULL;
      -- Rendre NOT NULL
      ALTER TABLE posts ALTER COLUMN description SET NOT NULL;
      RAISE NOTICE 'Colonne description rendue NOT NULL';
    ELSE
      RAISE NOTICE 'Colonne description déjà NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne description n''existe pas';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : Vérification
-- ============================================
-- Afficher les colonnes de la table posts
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name IN ('content', 'description', 'media_type')
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

-- Afficher les contraintes restantes sur la table posts
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'posts'::regclass
  AND conname LIKE '%media_type%'
ORDER BY conname;

