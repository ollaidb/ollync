-- ============================================
-- MISE À JOUR DE LA TABLE PROFILES POUR LES NOUVELLES PAGES
-- ============================================
-- Ce script ajoute les colonnes nécessaires pour les nouvelles pages de profil :
-- - Statut en ligne
-- - Connexion à deux étapes
-- - Gestion des données (consentement)
-- - Préférences de notifications
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Ajouter la colonne is_online (statut en ligne)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_online'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_online BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_online ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne is_online existe déjà dans la table profiles';
  END IF;
END $$;

-- 2. Ajouter la colonne two_factor_enabled (connexion à deux étapes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne two_factor_enabled ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne two_factor_enabled existe déjà dans la table profiles';
  END IF;
END $$;

-- 3. Ajouter la colonne data_consent_enabled (consentement des données)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'data_consent_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN data_consent_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne data_consent_enabled ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne data_consent_enabled existe déjà dans la table profiles';
  END IF;
END $$;

-- 4. Ajouter la colonne notification_preferences (préférences de notifications en JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne notification_preferences ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne notification_preferences existe déjà dans la table profiles';
  END IF;
END $$;

-- 5. Ajouter la colonne data_consent (consentement détaillé des données en JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'data_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN data_consent JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne data_consent ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne data_consent existe déjà dans la table profiles';
  END IF;
END $$;

-- 6. Vérifier que phone_verified existe (pour la page Numéro de téléphone)
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

-- 7. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor ON profiles(two_factor_enabled) WHERE two_factor_enabled = true;

-- 8. Vérification finale - Afficher toutes les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'is_online',
    'two_factor_enabled',
    'data_consent_enabled',
    'notification_preferences',
    'data_consent',
    'phone_verified'
  )
ORDER BY column_name;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MISE À JOUR TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes ajoutées/vérifiées :';
  RAISE NOTICE '  - is_online (BOOLEAN) : Statut en ligne';
  RAISE NOTICE '  - two_factor_enabled (BOOLEAN) : Connexion à deux étapes';
  RAISE NOTICE '  - data_consent_enabled (BOOLEAN) : Consentement des données';
  RAISE NOTICE '  - notification_preferences (JSONB) : Préférences de notifications';
  RAISE NOTICE '  - data_consent (JSONB) : Consentement détaillé des données';
  RAISE NOTICE '  - phone_verified (BOOLEAN) : Vérification du téléphone';
  RAISE NOTICE '';
  RAISE NOTICE 'Les nouvelles pages de profil sont maintenant prêtes à être utilisées !';
  RAISE NOTICE '';
END $$;

