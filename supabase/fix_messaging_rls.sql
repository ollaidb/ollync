-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR LA MESSAGERIE
-- ============================================
-- Ce script s'assure que les politiques RLS permettent la création de conversations
-- Exécutez ce script dans votre SQL Editor Supabase

-- Activer RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;

-- Créer les politiques pour conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND COALESCE(is_active, true) = true
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Supprimer les anciennes politiques pour messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Créer les politiques pour messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
              AND user_id = auth.uid()
              AND COALESCE(is_active, true) = true
          )
        )
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
              AND user_id = auth.uid()
              AND COALESCE(is_active, true) = true
          )
        )
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Politiques RLS mises à jour!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Les utilisateurs peuvent maintenant:';
  RAISE NOTICE '  - Créer des conversations';
  RAISE NOTICE '  - Voir leurs conversations';
  RAISE NOTICE '  - Envoyer des messages';
  RAISE NOTICE '========================================';
END $$;

