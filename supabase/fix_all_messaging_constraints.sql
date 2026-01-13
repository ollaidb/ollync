-- ============================================
-- CORRECTION COMPLÈTE DE TOUTES LES CONTRAINTES DE MESSAGERIE
-- ============================================
-- Ce script corrige TOUTES les contraintes qui bloquent l'envoi des messages
-- Exécutez ce script dans votre SQL Editor Supabase
-- ============================================

-- ============================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES CONTRAINTES
-- ============================================

DO $$ 
BEGIN
  -- Supprimer check_message_type
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_type'
    AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_type;
    RAISE NOTICE '✅ Contrainte check_message_type supprimée';
  END IF;

  -- Supprimer check_message_content
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_content;
    RAISE NOTICE '✅ Contrainte check_message_content supprimée';
  END IF;
END $$;

-- ============================================
-- 2. CRÉER LA NOUVELLE CONTRAINTE check_message_type
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_type CHECK (
      message_type IN (
        'text',              -- Message texte
        'photo',             -- Photo
        'video',             -- Vidéo
        'document',          -- Document
        'post_share',        -- Partage d'annonce
        'profile_share',    -- Partage de profil
        'calendar_request',  -- Rendez-vous
        'location',          -- Localisation
        'price',             -- Prix
        'rate',              -- Tarif
        'link',              -- Lien (ancien type)
        'post'               -- Post (ancien type)
      )
    );
    RAISE NOTICE '✅ Contrainte check_message_type créée';
  END IF;
END $$;

-- ============================================
-- 3. VÉRIFICATION FINALE
-- ============================================

DO $$ 
DECLARE
  type_constraint_exists BOOLEAN;
  content_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_type'
    AND conrelid = 'messages'::regclass
  ) INTO type_constraint_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) INTO content_constraint_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contrainte check_message_type: %', 
    CASE WHEN type_constraint_exists THEN '✅ Créée' ELSE '❌ Manquante' END;
  RAISE NOTICE 'Contrainte check_message_content: %', 
    CASE WHEN content_constraint_exists THEN '⚠️  Existe (peut bloquer)' ELSE '✅ Supprimée' END;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vous pouvez maintenant envoyer:';
  RAISE NOTICE '  ✅ Des rendez-vous';
  RAISE NOTICE '  ✅ Des annonces';
  RAISE NOTICE '  ✅ Des médias (photos, vidéos, documents)';
  RAISE NOTICE '  ✅ Des messages texte';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  Si vous avez encore des erreurs, exécutez:';
  RAISE NOTICE '    remove_check_message_content_constraint.sql';
  RAISE NOTICE '========================================';
END $$;
