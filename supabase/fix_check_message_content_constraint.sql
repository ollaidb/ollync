-- ============================================
-- CORRECTION DE LA CONTRAINTE check_message_content
-- ============================================
-- Ce script corrige la contrainte qui bloque l'envoi des messages
-- de type rendez-vous, annonce, médias, etc.
-- Exécutez ce script dans votre SQL Editor Supabase
-- ============================================

-- ============================================
-- 1. SUPPRIMER L'ANCIENNE CONTRAINTE
-- ============================================

DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_content;
    RAISE NOTICE '✅ Ancienne contrainte check_message_content supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Aucune contrainte check_message_content à supprimer';
  END IF;
END $$;

-- ============================================
-- 2. CRÉER LA NOUVELLE CONTRAINTE COMPLÈTE
-- ============================================
-- La nouvelle contrainte prend en compte tous les types de messages :
-- - text : doit avoir du contenu
-- - photo, video, document : doit avoir file_url
-- - post_share : doit avoir shared_post_id
-- - calendar_request : doit avoir calendar_request_data
-- - location : doit avoir location_data
-- - price : doit avoir price_data
-- - rate : doit avoir rate_data
-- - link : doit avoir link_url (ancien type)

DO $$ 
BEGIN
  -- Vérifier que les colonnes nécessaires existent
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    
    -- Créer la nouvelle contrainte complète
    ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
      -- Message texte : doit avoir du contenu
      (message_type = 'text' AND content IS NOT NULL) OR
      
      -- Messages avec fichiers : doivent avoir file_url
      (message_type = 'photo' AND file_url IS NOT NULL) OR
      (message_type = 'video' AND file_url IS NOT NULL) OR
      (message_type = 'document' AND file_url IS NOT NULL) OR
      
      -- Partage d'annonce : doit avoir shared_post_id
      (message_type = 'post_share' AND shared_post_id IS NOT NULL) OR
      
      -- Partage de profil : doit avoir shared_profile_id (si la colonne existe)
      (message_type = 'profile_share' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'shared_profile_id'
      ) AND shared_profile_id IS NOT NULL) OR
      
      -- Rendez-vous : doit avoir calendar_request_data
      (message_type = 'calendar_request' AND calendar_request_data IS NOT NULL) OR
      
      -- Localisation : doit avoir location_data (si la colonne existe)
      (message_type = 'location' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'location_data'
      ) AND location_data IS NOT NULL) OR
      
      -- Prix : doit avoir price_data (si la colonne existe)
      (message_type = 'price' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'price_data'
      ) AND price_data IS NOT NULL) OR
      
      -- Tarif : doit avoir rate_data (si la colonne existe)
      (message_type = 'rate' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'rate_data'
      ) AND rate_data IS NOT NULL) OR
      
      -- Lien : doit avoir link_url (ancien type, si la colonne existe)
      (message_type = 'link' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'link_url'
      ) AND link_url IS NOT NULL) OR
      
      -- Post : doit avoir post_id (ancien type, si la colonne existe)
      (message_type = 'post' AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'post_id'
      ) AND post_id IS NOT NULL)
    );
    
    RAISE NOTICE '✅ Nouvelle contrainte check_message_content créée avec succès';
  ELSE
    RAISE NOTICE '❌ La colonne message_type n''existe pas dans la table messages';
  END IF;
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
