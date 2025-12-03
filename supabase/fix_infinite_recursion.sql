-- ============================================
-- CORRECTION : Récursion infinie dans conversation_participants
-- ============================================
-- Ce script corrige l'erreur "infinite recursion detected in policy"
-- Exécutez ce script dans votre SQL Editor Supabase

-- Supprimer toutes les politiques problématiques
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join group conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- ============================================
-- POLITIQUES POUR CONVERSATIONS (sans récursion)
-- ============================================
-- Politique de lecture : les utilisateurs peuvent voir leurs conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Politique de création : les utilisateurs peuvent créer des conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Politique de mise à jour : les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- ============================================
-- POLITIQUES POUR CONVERSATION_PARTICIPANTS (sans récursion)
-- ============================================
-- Politique de lecture : les utilisateurs peuvent voir les participants des conversations où ils sont user1, user2 ou créateur
-- On évite de vérifier conversation_participants pour éviter la récursion
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid()
        )
    )
  );

-- Politique d'insertion : les utilisateurs peuvent s'ajouter aux groupes
CREATE POLICY "Users can join group conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.is_group = true
        AND conversations.group_creator_id = auth.uid()
    )
  );

-- Politique de mise à jour : les utilisateurs peuvent quitter les groupes
CREATE POLICY "Users can leave groups" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- POLITIQUES POUR MESSAGES (sans récursion)
-- ============================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Politique de lecture : les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid()
        )
    )
  );

-- Politique d'insertion : les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid()
        )
    )
  );

-- Politique de mise à jour : les utilisateurs peuvent modifier leurs propres messages
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Correction de la récursion infinie terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Les politiques ont été simplifiées pour éviter la récursion';
  RAISE NOTICE 'Les utilisateurs peuvent maintenant:';
  RAISE NOTICE '  - Créer des conversations';
  RAISE NOTICE '  - Voir leurs conversations';
  RAISE NOTICE '  - Envoyer des messages';
  RAISE NOTICE '========================================';
END $$;

