-- ============================================
-- VÉRIFICATION DES COLONNES DE MESSAGES
-- ============================================
-- Ce script vérifie que toutes les colonnes nécessaires existent
-- Exécutez ce script dans votre SQL Editor Supabase

-- Vérifier les colonnes de la table messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'username', 'full_name', 'avatar_url')
ORDER BY column_name;

-- Vérifier les colonnes de la table conversations
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Vérification des colonnes terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifiez que toutes les colonnes nécessaires existent';
  RAISE NOTICE 'Si des colonnes manquent, exécutez extend_messaging_features.sql';
  RAISE NOTICE '========================================';
END $$;

