-- ============================================
-- CORRECTION DE LA CONTRAINTE check_message_content (VERSION 2)
-- ============================================
-- Ce script corrige la contrainte qui bloque l'envoi des messages
-- Version simplifiée et corrigée
-- Exécutez ce script dans votre SQL Editor Supabase
-- ============================================

-- ============================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES CONTRAINTES
-- ============================================

DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_content;
    RAISE NOTICE '✅ Ancienne contrainte check_message_content supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Aucune contrainte check_message_content à supprimer';
  END IF;
END $$;

-- ============================================
-- 2. CRÉER LA NOUVELLE CONTRAINTE SIMPLIFIÉE
-- ============================================
-- Cette contrainte vérifie que chaque type de message a ses données requises
-- SANS utiliser EXISTS dans la contrainte (ce qui n'est pas permis)

DO $$ 
DECLARE
  has_file_url BOOLEAN;
  has_shared_post_id BOOLEAN;
  has_calendar_request_data BOOLEAN;
  has_location_data BOOLEAN;
  has_price_data BOOLEAN;
  has_rate_data BOOLEAN;
  has_link_url BOOLEAN;
  has_post_id BOOLEAN;
  constraint_sql TEXT;
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'file_url'
  ) INTO has_file_url;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'shared_post_id'
  ) INTO has_shared_post_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'calendar_request_data'
  ) INTO has_calendar_request_data;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'location_data'
  ) INTO has_location_data;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'price_data'
  ) INTO has_price_data;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'rate_data'
  ) INTO has_rate_data;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'link_url'
  ) INTO has_link_url;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'post_id'
  ) INTO has_post_id;
  
  -- Construire la contrainte dynamiquement selon les colonnes disponibles
  constraint_sql := 'ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (';
  constraint_sql := constraint_sql || '(message_type = ''text'' AND content IS NOT NULL)';
  
  -- Ajouter les conditions pour les types de fichiers
  IF has_file_url THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''photo'' AND file_url IS NOT NULL)';
    constraint_sql := constraint_sql || ' OR (message_type = ''video'' AND file_url IS NOT NULL)';
    constraint_sql := constraint_sql || ' OR (message_type = ''document'' AND file_url IS NOT NULL)';
  END IF;
  
  -- Partage d'annonce
  IF has_shared_post_id THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''post_share'' AND shared_post_id IS NOT NULL)';
  END IF;
  
  -- Rendez-vous
  IF has_calendar_request_data THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''calendar_request'' AND calendar_request_data IS NOT NULL)';
  END IF;
  
  -- Localisation
  IF has_location_data THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''location'' AND location_data IS NOT NULL)';
  END IF;
  
  -- Prix
  IF has_price_data THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''price'' AND price_data IS NOT NULL)';
  END IF;
  
  -- Tarif
  IF has_rate_data THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''rate'' AND rate_data IS NOT NULL)';
  END IF;
  
  -- Lien (ancien type)
  IF has_link_url THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''link'' AND link_url IS NOT NULL)';
  END IF;
  
  -- Post (ancien type)
  IF has_post_id THEN
    constraint_sql := constraint_sql || ' OR (message_type = ''post'' AND post_id IS NOT NULL)';
  END IF;
  
  constraint_sql := constraint_sql || ')';
  
  -- Exécuter la contrainte
  EXECUTE constraint_sql;
  
  RAISE NOTICE '✅ Nouvelle contrainte check_message_content créée avec succès';
  RAISE NOTICE 'Colonnes détectées:';
  RAISE NOTICE '  - file_url: %', has_file_url;
  RAISE NOTICE '  - shared_post_id: %', has_shared_post_id;
  RAISE NOTICE '  - calendar_request_data: %', has_calendar_request_data;
  RAISE NOTICE '  - location_data: %', has_location_data;
  RAISE NOTICE '  - price_data: %', has_price_data;
  RAISE NOTICE '  - rate_data: %', has_rate_data;
  RAISE NOTICE '  - link_url: %', has_link_url;
  RAISE NOTICE '  - post_id: %', has_post_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création de la contrainte: %', SQLERRM;
    RAISE;
END $$;

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$ 
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  -- Vérifier que la contrainte existe
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CONTRAINTE CORRIGÉE AVEC SUCCÈS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'La contrainte check_message_content prend maintenant en compte:';
    RAISE NOTICE '  ✅ Messages texte (content requis)';
    RAISE NOTICE '  ✅ Photos, vidéos, documents (file_url requis)';
    RAISE NOTICE '  ✅ Partage d''annonce (shared_post_id requis)';
    RAISE NOTICE '  ✅ Rendez-vous (calendar_request_data requis)';
    RAISE NOTICE '  ✅ Autres types de messages';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant envoyer:';
    RAISE NOTICE '  - Des rendez-vous';
    RAISE NOTICE '  - Des annonces';
    RAISE NOTICE '  - Des médias (photos, vidéos, documents)';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '❌ ERREUR: La contrainte n''a pas été créée';
  END IF;
END $$;
