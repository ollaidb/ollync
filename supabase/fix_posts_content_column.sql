-- Script pour corriger la colonne content dans la table posts
-- Si la colonne content existe et est NOT NULL, on la rend nullable ou on la supprime
-- Si elle n'existe pas, on s'assure que description existe et est NOT NULL

DO $$
BEGIN
  -- Vérifier si la colonne content existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'content'
  ) THEN
    -- Si content existe et est NOT NULL, la rendre nullable
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'content'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;
      RAISE NOTICE 'Contrainte NOT NULL retirée de la colonne content';
    END IF;
    
    -- Optionnel : supprimer la colonne content si elle n'est pas utilisée
    -- ALTER TABLE posts DROP COLUMN IF EXISTS content;
  END IF;
  
  -- S'assurer que description existe et est NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'description'
  ) THEN
    -- Si description existe mais est nullable, la rendre NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'description'
        AND is_nullable = 'YES'
    ) THEN
      -- Mettre à jour les valeurs NULL avec une valeur par défaut
      UPDATE posts SET description = '' WHERE description IS NULL;
      ALTER TABLE posts ALTER COLUMN description SET NOT NULL;
      RAISE NOTICE 'Colonne description rendue NOT NULL';
    END IF;
  ELSE
    -- Si description n'existe pas, la créer
    ALTER TABLE posts ADD COLUMN description TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Colonne description créée';
  END IF;
END $$;

-- Vérifier le résultat
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

