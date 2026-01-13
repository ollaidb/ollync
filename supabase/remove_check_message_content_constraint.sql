-- ============================================
-- SUPPRESSION COMPLÈTE DE LA CONTRAINTE check_message_content
-- ============================================
-- Ce script supprime complètement la contrainte si elle pose problème
-- Utilisez ce script si la version v2 ne fonctionne toujours pas
-- Exécutez ce script dans votre SQL Editor Supabase
-- ============================================

-- Supprimer la contrainte si elle existe
DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT check_message_content;
    RAISE NOTICE '✅ Contrainte check_message_content supprimée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Aucune contrainte check_message_content à supprimer';
  END IF;
END $$;

-- Vérification
DO $$ 
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
    AND conrelid = 'messages'::regclass
  ) INTO constraint_exists;
  
  IF NOT constraint_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CONTRAINTE SUPPRIMÉE AVEC SUCCÈS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant envoyer tous types de messages:';
    RAISE NOTICE '  - Des rendez-vous';
    RAISE NOTICE '  - Des annonces';
    RAISE NOTICE '  - Des médias (photos, vidéos, documents)';
    RAISE NOTICE '  - Des messages texte';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  NOTE: La contrainte a été supprimée pour permettre';
    RAISE NOTICE '    l''envoi de tous les types de messages.';
    RAISE NOTICE '    La validation se fera au niveau de l''application.';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '❌ ERREUR: La contrainte existe toujours';
  END IF;
END $$;
