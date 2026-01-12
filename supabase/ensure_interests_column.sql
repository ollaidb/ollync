-- ============================================
-- VÉRIFICATION ET CRÉATION DE LA COLONNE SKILLS POUR LES CENTRES D'INTÉRÊT
-- ============================================
-- Ce script s'assure que la colonne skills existe dans la table profiles
-- pour stocker les centres d'intérêt des utilisateurs
-- Exécutez ce script dans votre SQL Editor Supabase

-- Vérifier et créer la colonne skills si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
    RAISE NOTICE '✅ Colonne skills créée dans la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne skills existe déjà dans la table profiles';
  END IF;
END $$;

-- Vérifier le type de la colonne skills
DO $$
DECLARE
  column_type TEXT;
BEGIN
  SELECT data_type INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'skills';
  
  IF column_type IS NULL THEN
    RAISE NOTICE '⚠️  Colonne skills non trouvée';
  ELSIF column_type = 'ARRAY' THEN
    RAISE NOTICE '✅ Colonne skills est de type ARRAY (parfait pour les centres d''intérêt)';
  ELSE
    RAISE NOTICE '⚠️  Colonne skills existe mais n''est pas de type ARRAY (type actuel: %)', column_type;
  END IF;
END $$;

-- Afficher un résumé de la colonne
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'skills';

-- Note: La colonne skills (TEXT[]) est utilisée pour stocker les centres d'intérêt
-- Format: ['Création de contenu', 'Figurant', 'Montage', ...]
-- Pas besoin de table séparée, cette structure est suffisante et performante
