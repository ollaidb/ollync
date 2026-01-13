-- ============================================
-- CORRECTION DE LA CONTRAINTE check_message_type
-- ============================================
-- Ce script corrige la contrainte qui bloque l'envoi des messages
-- car elle n'autorise que les anciens types (text, post, link)
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
    WHERE conname = 'check_message_type'
    AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_type;
    RAISE NOTICE '✅ Ancienne contrainte check_message_type supprimée';
  ELSE
    RAISE NOTICE 'ℹ️ Aucune contrainte check_message_type à supprimer';
  END IF;
END $$;

-- ============================================
-- 2. CRÉER LA NOUVELLE CONTRAINTE COMPLÈTE
-- ============================================
-- Cette contrainte autorise tous les types de messages supportés

DO $$ 
BEGIN
  -- Vérifier que la colonne message_type existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    
    -- Créer la nouvelle contrainte avec tous les types supportés
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
    
    RAISE NOTICE '✅ Nouvelle contrainte check_message_type créée avec succès';
    RAISE NOTICE 'Types de messages autorisés:';
    RAISE NOTICE '  - text, photo, video, document';
    RAISE NOTICE '  - post_share, profile_share';
    RAISE NOTICE '  - calendar_request, location';
    RAISE NOTICE '  - price, rate, link, post';
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
    WHERE conname = 'check_message_type'
    AND conrelid = 'messages'::regclass
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CONTRAINTE CORRIGÉE AVEC SUCCÈS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'La contrainte check_message_type autorise maintenant:';
    RAISE NOTICE '  ✅ Messages texte';
    RAISE NOTICE '  ✅ Photos, vidéos, documents';
    RAISE NOTICE '  ✅ Partage d''annonce';
    RAISE NOTICE '  ✅ Rendez-vous';
    RAISE NOTICE '  ✅ Tous les autres types de messages';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant envoyer:';
    RAISE NOTICE '  - Des rendez-vous';
    RAISE NOTICE '  - Des annonces';
    RAISE NOTICE '  - Des médias (photos, vidéos, documents)';
    RAISE NOTICE '  - Des messages texte';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '❌ ERREUR: La contrainte n''a pas été créée';
  END IF;
END $$;
