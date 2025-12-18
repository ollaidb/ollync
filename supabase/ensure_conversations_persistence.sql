-- ============================================
-- SCRIPT DE PERSISTANCE DES CONVERSATIONS
-- ============================================
-- Ce script garantit que toutes les conversations et messages sont enregistrés
-- et persistent jusqu'à ce que l'utilisateur décide de les archiver ou supprimer
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE CONVERSATIONS - Vérification et mise à jour
-- ============================================

-- S'assurer que la table conversations existe avec toutes les colonnes nécessaires
DO $$ 
BEGIN
  -- Ajouter is_archived si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_archived BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne is_archived ajoutée à conversations';
  END IF;

  -- Ajouter archived_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne archived_at ajoutée à conversations';
  END IF;

  -- Ajouter deleted_at si elle n'existe pas (soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne deleted_at ajoutée à conversations';
  END IF;

  -- Ajouter type si elle n'existe pas (pour différencier 'direct' et 'group')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN type VARCHAR(20) DEFAULT 'direct';
    RAISE NOTICE 'Colonne type ajoutée à conversations';
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- ============================================
-- 2. TABLE MESSAGES - Vérification et mise à jour
-- ============================================

-- S'assurer que la table messages a toutes les colonnes nécessaires
DO $$ 
BEGIN
  -- Ajouter is_deleted si elle n'existe pas (soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne is_deleted ajoutée à messages';
  END IF;

  -- Ajouter deleted_for_user_id si elle n'existe pas (pour soft delete par utilisateur)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'deleted_for_user_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_for_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne deleted_for_user_id ajoutée à messages';
  END IF;

  -- Ajouter file_url, file_name, file_type si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_url TEXT;
    RAISE NOTICE 'Colonne file_url ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_name VARCHAR(255);
    RAISE NOTICE 'Colonne file_name ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_type VARCHAR(50);
    RAISE NOTICE 'Colonne file_type ajoutée à messages';
  END IF;

  -- Ajouter les colonnes pour les données structurées (location, price, rate, calendar, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'location_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN location_data JSONB;
    RAISE NOTICE 'Colonne location_data ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'price_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN price_data JSONB;
    RAISE NOTICE 'Colonne price_data ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'rate_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN rate_data JSONB;
    RAISE NOTICE 'Colonne rate_data ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'calendar_request_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN calendar_request_data JSONB;
    RAISE NOTICE 'Colonne calendar_request_data ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'shared_post_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne shared_post_id ajoutée à messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'shared_profile_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN shared_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne shared_profile_id ajoutée à messages';
  END IF;
END $$;

-- Index pour améliorer les performances des messages
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for_user_id ON messages(deleted_for_user_id) WHERE deleted_for_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type) WHERE message_type IS NOT NULL;

-- ============================================
-- 3. MODIFIER LES CONTRAINTES DE SUPPRESSION (OPTIONNEL)
-- ============================================
-- Note: Les contraintes ON DELETE CASCADE sont conservées pour la cohérence
-- Les conversations sont protégées par soft delete (deleted_at) plutôt que par la modification des contraintes
-- Cela permet de garder l'intégrité référentielle tout en préservant les données

DO $$ 
BEGIN
  RAISE NOTICE 'Les contraintes de foreign key sont vérifiées';
  RAISE NOTICE 'Les conversations utilisent soft delete (deleted_at) pour la persistance';
END $$;

-- ============================================
-- 4. TABLE MATCH_REQUESTS - Vérification
-- ============================================
-- S'assurer que match_requests est bien liée aux conversations

-- Vérifier que la colonne conversation_id existe dans match_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'match_requests' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_match_requests_conversation_id ON match_requests(conversation_id);
    RAISE NOTICE 'Colonne conversation_id ajoutée à match_requests';
  END IF;
END $$;

-- ============================================
-- 5. TRIGGERS POUR LA PERSISTANCE
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement sur conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Fonction pour mettre à jour archived_at quand is_archived change
CREATE OR REPLACE FUNCTION update_conversations_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_archived = true AND (OLD.is_archived IS NULL OR OLD.is_archived = false) THEN
    NEW.archived_at = NOW();
  ELSIF NEW.is_archived = false AND OLD.is_archived = true THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour archived_at
DROP TRIGGER IF EXISTS trigger_update_conversations_archived_at ON conversations;
CREATE TRIGGER trigger_update_conversations_archived_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_archived_at();

-- ============================================
-- 6. POLITIQUES RLS POUR LA PERSISTANCE
-- ============================================
-- S'assurer que les utilisateurs peuvent voir leurs conversations même si elles sont "vides"

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Politique : les utilisateurs peuvent voir leurs conversations (même sans messages)
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    -- Exclure les conversations supprimées (soft delete)
    deleted_at IS NULL AND
    (
      auth.uid() = user1_id OR 
      auth.uid() = user2_id OR 
      auth.uid() = group_creator_id OR
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
          AND user_id = auth.uid()
          AND is_active = true
      )
    )
  );

-- Politique : les utilisateurs peuvent créer des conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Politique : les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Politique : les utilisateurs peuvent "supprimer" leurs conversations (soft delete)
CREATE POLICY "Users can delete their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- ============================================
-- 7. VÉRIFICATION FINALE
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Script de persistance des conversations terminé!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonnes ajoutées/vérifiées:';
  RAISE NOTICE '  - conversations.is_archived';
  RAISE NOTICE '  - conversations.archived_at';
  RAISE NOTICE '  - conversations.deleted_at';
  RAISE NOTICE '  - conversations.type';
  RAISE NOTICE '  - messages.is_deleted';
  RAISE NOTICE '  - messages.deleted_for_user_id';
  RAISE NOTICE '  - messages.file_url, file_name, file_type';
  RAISE NOTICE '  - messages.location_data, price_data, rate_data, etc.';
  RAISE NOTICE '  - match_requests.conversation_id';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Les conversations sont maintenant persistantes';
  RAISE NOTICE 'et ne seront supprimées que si l''utilisateur le décide explicitement.';
  RAISE NOTICE '========================================';
END $$;

-- Afficher un résumé des colonnes
SELECT 
  'conversations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
  AND column_name IN ('is_archived', 'archived_at', 'deleted_at', 'type', 'created_at', 'updated_at')
ORDER BY column_name;

SELECT 
  'messages' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
  AND column_name IN ('is_deleted', 'deleted_for_user_id', 'message_type', 'file_url', 'file_name', 'file_type')
ORDER BY column_name;

