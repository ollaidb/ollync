-- ============================================
-- AJOUT DES COLONNES POUR L'ÉDITION DU PROFIL
-- ============================================
-- Ce script ajoute les colonnes nécessaires pour la page d'édition du profil
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Ajouter la colonne distance (rayon de recherche)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'distance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN distance VARCHAR(20);
    RAISE NOTICE 'Colonne distance ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne distance existe déjà dans la table profiles';
  END IF;
END $$;

-- 2. Ajouter la colonne social_links (JSON pour stocker les liens sociaux)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'social_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne social_links ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne social_links existe déjà dans la table profiles';
  END IF;
END $$;

-- 3. Ajouter la colonne phone_verified (vérification du téléphone)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne phone_verified ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne phone_verified existe déjà dans la table profiles';
  END IF;
END $$;

-- 4. Ajouter les colonnes skills et services si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
    RAISE NOTICE 'Colonne skills ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne skills existe déjà dans la table profiles';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'services'
  ) THEN
    ALTER TABLE profiles ADD COLUMN services TEXT[];
    RAISE NOTICE 'Colonne services ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne services existe déjà dans la table profiles';
  END IF;
END $$;

-- 5. Ajouter la colonne availability si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability VARCHAR(255);
    RAISE NOTICE 'Colonne availability ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne availability existe déjà dans la table profiles';
  END IF;
END $$;

-- Vérification finale
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('distance', 'social_links', 'phone_verified', 'skills', 'services', 'availability')
ORDER BY column_name;

