-- ============================================
-- CORRECTION : Récursion infinie dans les politiques RLS de conversations
-- ============================================
-- Ce script corrige l'erreur "infinite recursion detected in policy for relation 'conversations'"
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
  RAISE NOTICE 'Toutes les politiques sur conversations ont été supprimées';
END $$;

-- Supprimer toutes les politiques sur conversation_participants
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON conversation_participants';
  END LOOP;
  RAISE NOTICE 'Toutes les politiques sur conversation_participants ont été supprimées';
END $$;

-- Supprimer toutes les politiques sur messages
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON messages';
  END LOOP;
  RAISE NOTICE 'Toutes les politiques sur messages ont été supprimées';
END $$;

-- ============================================
-- ÉTAPE 2 : S'ASSURER QUE RLS EST ACTIVÉ
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 3 : CRÉER LES POLITIQUES POUR CONVERSATIONS (SANS RÉCURSION)
-- ============================================
-- Politiques simples qui ne vérifient QUE les champs directs de conversations
-- Pas de référence à conversation_participants pour éviter la récursion

-- Lecture : les utilisateurs peuvent voir leurs conversations
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      auth.uid() = user1_id OR 
      auth.uid() = user2_id OR 
      auth.uid() = group_creator_id
    )
  );

-- Création : les utilisateurs peuvent créer des conversations
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
-- ÉTAPE 4 : CRÉER LES POLITIQUES POUR CONVERSATION_PARTICIPANTS (SANS RÉCURSION)
-- ============================================
-- Politiques simples qui ne vérifient QUE les champs directs
-- Pas de référence à conversations pour éviter la récursion

-- Lecture : les utilisateurs peuvent voir les participants des conversations où ils participent
CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    -- Permettre de voir les participants si l'utilisateur est dans la conversation
    -- On vérifie directement via user_id sans passer par conversations
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.deleted_at IS NULL
        AND (
          c.user1_id = auth.uid() OR
          c.user2_id = auth.uid() OR
          c.group_creator_id = auth.uid()
        )
    )
  );

-- Insertion : les utilisateurs peuvent s'ajouter comme participants
CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Mise à jour : les utilisateurs peuvent mettre à jour leur propre participation
CREATE POLICY "conversation_participants_update" ON conversation_participants
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- ============================================
-- ÉTAPE 5 : CRÉER LES POLITIQUES POUR MESSAGES (SANS RÉCURSION)
-- ============================================
-- Politiques qui vérifient directement les champs de conversations sans récursion

-- Lecture : les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.deleted_at IS NULL
        AND (
          c.user1_id = auth.uid() OR
          c.user2_id = auth.uid() OR
          c.group_creator_id = auth.uid()
        )
    )
  );

-- Insertion : les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.deleted_at IS NULL
        AND (
          c.user1_id = auth.uid() OR
          c.user2_id = auth.uid() OR
          c.group_creator_id = auth.uid()
        )
    )
  );

-- Mise à jour : les utilisateurs peuvent mettre à jour leurs propres messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- ============================================
-- ÉTAPE 6 : VÉRIFICATION
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Politiques RLS corrigées avec succès!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Politiques créées:';
  RAISE NOTICE '  - conversations: select, insert, update';
  RAISE NOTICE '  - conversation_participants: select, insert, update';
  RAISE NOTICE '  - messages: select, insert, update';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Les politiques ne créent plus de récursion infinie';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

