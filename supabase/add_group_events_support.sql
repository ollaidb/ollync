-- ============================================
-- SUPPORT DES ÉVÉNEMENTS DE GROUPE
-- ============================================
-- Ce script assure que la base de données supporte les messages d'événements
-- de groupe (ajout/suppression de membres, changement de nom/photo, etc.)
-- Exécutez ce script dans le SQL Editor Supabase si nécessaire.

-- 1. S'assurer que la table notifications a la colonne metadata (pour les notifications d'ajout au groupe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB;
    RAISE NOTICE '✅ Colonne metadata ajoutée à notifications';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne metadata existe déjà dans notifications';
  END IF;
END $$;

-- 2. S'assurer que la table messages a calendar_request_data (pour stocker les métadonnées des événements de groupe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'calendar_request_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN calendar_request_data JSONB;
    RAISE NOTICE '✅ Colonne calendar_request_data ajoutée à messages';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne calendar_request_data existe déjà dans messages';
  END IF;
END $$;

-- Note: Les messages d'événements de groupe utilisent message_type = 'text' avec
-- calendar_request_data contenant: { kind: 'group_event', event_type: 'member_added'|'member_removed'|'member_left'|'group_updated', members?: [...], group_name?: string }
-- Aucune modification de contrainte check_message_type n'est nécessaire.
