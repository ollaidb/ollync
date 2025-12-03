-- ============================================
-- CORRECTION : Erreur "column c.post_id does not exist"
-- ============================================
-- Ce script corrige l'erreur lors de l'envoi de messages
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- ÉTAPE 1 : VÉRIFIER QUE LA COLONNE POST_ID EXISTE
-- ============================================

-- S'assurer que post_id existe dans conversations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'conversations' 
      AND column_name = 'post_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Colonne post_id ajoutée à conversations';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne post_id existe déjà dans conversations';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : SUPPRIMER ET RECRÉER LA POLITIQUE MESSAGES_INSERT
-- ============================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Recréer la politique avec une requête plus simple et robuste
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.user1_id = auth.uid() OR
          c.user2_id = auth.uid() OR
          c.group_creator_id = auth.uid()
        )
    )
  );

-- ============================================
-- ÉTAPE 3 : VÉRIFIER QUE LA COLONNE MESSAGE_TYPE EXISTE
-- ============================================

-- S'assurer que message_type existe dans messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'messages' 
      AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
    RAISE NOTICE '✅ Colonne message_type ajoutée à messages';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne message_type existe déjà dans messages';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION
-- ============================================

-- Afficher la politique créée
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'messages'
  AND policyname = 'messages_insert';

-- Vérifier les colonnes de conversations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
  AND column_name IN ('post_id', 'user1_id', 'user2_id', 'group_creator_id', 'is_group')
ORDER BY column_name;

-- Vérifier les colonnes de messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND column_name IN ('conversation_id', 'sender_id', 'content', 'message_type')
ORDER BY column_name;

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Correction de la politique messages terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'La politique messages_insert a été recréée';
  RAISE NOTICE 'Vous pouvez maintenant envoyer des messages!';
  RAISE NOTICE '========================================';
END $$;

