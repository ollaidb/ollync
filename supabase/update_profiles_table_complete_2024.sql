-- ============================================
-- MISE À JOUR COMPLÈTE DE LA TABLE PROFILES
-- ============================================
-- Ce script vérifie et crée toutes les colonnes nécessaires pour la page d'édition du profil public
-- Exécutez ce script dans votre SQL Editor Supabase
-- Date: 2024 - Mise à jour pour les centres d'intérêt et statuts professionnels

-- ============================================
-- ÉTAPE 1 : CRÉER LA TABLE PROFILES SI ELLE N'EXISTE PAS
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 2 : COLONNES DE BASE (photo, nom, adresse, etc.)
-- ============================================

-- avatar_url (photo de profil)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✅ Colonne avatar_url ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne avatar_url existe déjà';
  END IF;
END $$;

-- username (nom d'utilisateur)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username VARCHAR(100) UNIQUE;
    RAISE NOTICE '✅ Colonne username ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne username existe déjà';
  END IF;
END $$;

-- full_name (nom complet)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name VARCHAR(255);
    RAISE NOTICE '✅ Colonne full_name ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne full_name existe déjà';
  END IF;
END $$;

-- location (adresse)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location VARCHAR(255);
    RAISE NOTICE '✅ Colonne location ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne location existe déjà';
  END IF;
END $$;

-- bio (description)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
    RAISE NOTICE '✅ Colonne bio ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne bio existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : COLONNES POUR LES CENTRES D'INTÉRÊT ET SERVICES
-- ============================================

-- skills (centres d'intérêt - TEXT[])
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
    RAISE NOTICE '✅ Colonne skills (centres d''intérêt) ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne skills existe déjà';
  END IF;
END $$;

-- services (services proposés - JSONB pour stocker des objets complexes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'services'
  ) THEN
    -- Vérifier si c'est déjà un JSONB, sinon le convertir
    ALTER TABLE profiles ADD COLUMN services JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne services (JSONB) ajoutée';
  ELSE
    -- Si la colonne existe mais est TEXT[], on peut la laisser (compatibilité)
    RAISE NOTICE 'ℹ️  Colonne services existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : RÉSEAUX SOCIAUX
-- ============================================

-- social_links (réseaux sociaux - JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'social_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne social_links ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne social_links existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : STATUTS PROFESSIONNELS (NOUVEAU)
-- ============================================

-- statuses (statuts professionnels - JSONB pour stocker Array<{ name: string; description: string }>)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'statuses'
  ) THEN
    ALTER TABLE profiles ADD COLUMN statuses JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne statuses (statuts professionnels) ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne statuses existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : AUTRES COLONNES UTILES
-- ============================================

-- distance (rayon de recherche)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'distance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN distance VARCHAR(20);
    RAISE NOTICE '✅ Colonne distance ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne distance existe déjà';
  END IF;
END $$;

-- phone (téléphone)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE '✅ Colonne phone ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne phone existe déjà';
  END IF;
END $$;

-- phone_verified (vérification du téléphone)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne phone_verified ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne phone_verified existe déjà';
  END IF;
END $$;

-- availability (disponibilité)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability VARCHAR(255);
    RAISE NOTICE '✅ Colonne availability ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne availability existe déjà';
  END IF;
END $$;

-- languages (langues parlées)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne languages ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne languages existe déjà';
  END IF;
END $$;

-- badges (badges de vérification)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'badges'
  ) THEN
    ALTER TABLE profiles ADD COLUMN badges TEXT[];
    RAISE NOTICE '✅ Colonne badges ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne badges existe déjà';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 7 : CRÉER LES INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- ÉTAPE 8 : VÉRIFICATION FINALE
-- ============================================

-- Afficher toutes les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- ÉTAPE 9 : RÉSUMÉ
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MISE À JOUR DE LA TABLE PROFILES TERMINÉE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Colonnes disponibles pour l''édition du profil:';
  RAISE NOTICE '';
  RAISE NOTICE '  📸 Photo & Identité:';
  RAISE NOTICE '    - avatar_url (photo de profil)';
  RAISE NOTICE '    - username (nom d''utilisateur)';
  RAISE NOTICE '    - full_name (nom complet)';
  RAISE NOTICE '    - email (email)';
  RAISE NOTICE '';
  RAISE NOTICE '  📍 Localisation:';
  RAISE NOTICE '    - location (adresse)';
  RAISE NOTICE '    - distance (rayon de recherche)';
  RAISE NOTICE '';
  RAISE NOTICE '  📝 Description:';
  RAISE NOTICE '    - bio (description)';
  RAISE NOTICE '';
  RAISE NOTICE '  🎯 Centres d''intérêt & Services:';
  RAISE NOTICE '    - skills (TEXT[]) - Centres d''intérêt';
  RAISE NOTICE '    - services (JSONB) - Services proposés';
  RAISE NOTICE '    - statuses (JSONB) - Statuts professionnels';
  RAISE NOTICE '';
  RAISE NOTICE '  🔗 Réseaux sociaux:';
  RAISE NOTICE '    - social_links (JSONB) - Instagram, TikTok, LinkedIn, etc.';
  RAISE NOTICE '';
  RAISE NOTICE '  📞 Contact:';
  RAISE NOTICE '    - phone (téléphone)';
  RAISE NOTICE '    - phone_verified (vérification téléphone)';
  RAISE NOTICE '';
  RAISE NOTICE '  ⚙️ Autres:';
  RAISE NOTICE '    - availability (disponibilité)';
  RAISE NOTICE '    - languages (JSONB) - Langues parlées';
  RAISE NOTICE '    - badges (TEXT[]) - Badges de vérification';
  RAISE NOTICE '';
  RAISE NOTICE '  📅 Métadonnées:';
  RAISE NOTICE '    - created_at, updated_at';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
