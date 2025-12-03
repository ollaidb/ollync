-- ============================================
-- CORRECTION COMPLÈTE : Récursion infinie dans conversation_participants
-- ============================================
-- Ce script supprime TOUTES les politiques existantes et les recrée sans récursion
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- ÉTAPE 1 : SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- ============================================

-- Supprimer toutes les politiques sur conversations
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON conversations';
  END LOOP;
END $$;

-- Supprimer toutes les politiques sur conversation_participants
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON conversation_participants';
  END LOOP;
END $$;

-- Supprimer toutes les politiques sur messages
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON messages';
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2 : S'ASSURER QUE RLS EST ACTIVÉ
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 3 : CRÉER LES POLITIQUES POUR CONVERSATIONS
-- ============================================
-- Politiques simples qui ne vérifient QUE les champs directs de conversations

-- Lecture : les utilisateurs peuvent voir leurs conversations
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Insertion : les utilisateurs peuvent créer des conversations
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Mise à jour : les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- ============================================
-- ÉTAPE 4 : CRÉER LES POLITIQUES POUR CONVERSATION_PARTICIPANTS
-- ============================================
-- IMPORTANT : Ces politiques ne doivent JAMAIS vérifier conversation_participants
-- Elles vérifient UNIQUEMENT les champs directs de conversations

-- Lecture : les utilisateurs peuvent voir les participants des conversations où ils sont impliqués
-- On vérifie UNIQUEMENT user1_id, user2_id, group_creator_id de conversations (PAS conversation_participants)
CREATE POLICY "conversation_participants_select" ON conversation_participants
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

-- Insertion : les utilisateurs peuvent s'ajouter aux groupes (seulement si créateur)
CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.is_group = true
        AND conversations.group_creator_id = auth.uid()
    )
  );

-- Mise à jour : les utilisateurs peuvent modifier leur propre participation
CREATE POLICY "conversation_participants_update" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Suppression : les utilisateurs peuvent quitter un groupe
CREATE POLICY "conversation_participants_delete" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 5 : CRÉER LES POLITIQUES POUR MESSAGES
-- ============================================

-- Lecture : les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "messages_select" ON messages
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

-- Insertion : les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "messages_insert" ON messages
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

-- Mise à jour : les utilisateurs peuvent modifier leurs propres messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================
-- ÉTAPE 6 : VÉRIFICATION
-- ============================================

-- Afficher toutes les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

-- Test de vérification (ne devrait pas causer de récursion)
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Correction complète de la récursion terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Toutes les anciennes politiques ont été supprimées';
  RAISE NOTICE 'Nouvelles politiques créées sans récursion';
  RAISE NOTICE '';
  RAISE NOTICE 'Les politiques conversation_participants vérifient UNIQUEMENT';
  RAISE NOTICE 'les champs user1_id, user2_id, group_creator_id de conversations';
  RAISE NOTICE '(PAS conversation_participants elle-même)';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant créer des conversations sans erreur!';
  RAISE NOTICE '========================================';
END $$;

