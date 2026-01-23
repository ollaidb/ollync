-- ============================================
-- MISE À JOUR COMPLÈTE DE LA TABLE PROFILES
-- ============================================
-- Ce script ajoute toutes les colonnes nécessaires pour les pages de profil public et d'édition
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
    RAISE NOTICE '✅ Colonne distance ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne distance existe déjà dans la table profiles';
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
    RAISE NOTICE '✅ Colonne social_links ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne social_links existe déjà dans la table profiles';
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
    RAISE NOTICE '✅ Colonne phone_verified ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne phone_verified existe déjà dans la table profiles';
  END IF;
END $$;

-- 4. Ajouter la colonne skills (compétences)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
    RAISE NOTICE '✅ Colonne skills ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne skills existe déjà dans la table profiles';
  END IF;
END $$;

-- 5. Ajouter la colonne services
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'services'
  ) THEN
    ALTER TABLE profiles ADD COLUMN services TEXT[];
    RAISE NOTICE '✅ Colonne services ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne services existe déjà dans la table profiles';
  END IF;
END $$;

-- 6. Ajouter la colonne availability (disponibilité)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability VARCHAR(255);
    RAISE NOTICE '✅ Colonne availability ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne availability existe déjà dans la table profiles';
  END IF;
END $$;

-- 7. Ajouter la colonne languages (langues parlées - format JSON)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne languages ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne languages existe déjà dans la table profiles';
  END IF;
END $$;

-- 8. Ajouter la colonne badges (badges de vérification)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'badges'
  ) THEN
    ALTER TABLE profiles ADD COLUMN badges TEXT[];
    RAISE NOTICE '✅ Colonne badges ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne badges existe déjà dans la table profiles';
  END IF;
END $$;

-- 9. S'assurer que les colonnes de base existent
DO $$ 
BEGIN
  -- Vérifier et ajouter avatar_url si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✅ Colonne avatar_url ajoutée à la table profiles';
  END IF;

  -- Vérifier et ajouter bio si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
    RAISE NOTICE '✅ Colonne bio ajoutée à la table profiles';
  END IF;

  -- Vérifier et ajouter location si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location VARCHAR(255);
    RAISE NOTICE '✅ Colonne location ajoutée à la table profiles';
  END IF;

  -- Vérifier et ajouter phone si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE '✅ Colonne phone ajoutée à la table profiles';
  END IF;
END $$;

-- 10. Unicité email et téléphone (sécurité)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique
  ON profiles (lower(email))
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL;

-- 11. Vérification finale - Afficher toutes les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 12. Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Mise à jour de la table profiles terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonnes disponibles:';
  RAISE NOTICE '  - id, email, username, full_name';
  RAISE NOTICE '  - avatar_url, bio, location, phone';
  RAISE NOTICE '  - distance, availability';
  RAISE NOTICE '  - skills (TEXT[]), services (TEXT[])';
  RAISE NOTICE '  - social_links (JSONB)';
  RAISE NOTICE '  - languages (JSONB)';
  RAISE NOTICE '  - badges (TEXT[])';
  RAISE NOTICE '  - phone_verified (BOOLEAN)';
  RAISE NOTICE '  - created_at, updated_at';
  RAISE NOTICE '========================================';
END $$;

