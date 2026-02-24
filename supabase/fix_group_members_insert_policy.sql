-- ============================================
-- CORRECTION : Créateur peut ajouter d'autres membres au groupe
-- ============================================
-- La politique actuelle n'autorise qu'à s'ajouter soi-même (auth.uid() = user_id).
-- Le créateur doit pouvoir ajouter les autres participants lors de la création
-- ou via "Ajouter un membre". Sans cela, la liste reste vide (Membres (0)).
-- Exécutez ce script dans le SQL Editor Supabase.

-- 1. Supprimer les anciennes politiques INSERT sur conversation_participants
DROP POLICY IF EXISTS "Users can join group conversations" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;

-- 2. Nouvelle politique : le créateur peut ajouter quiconque, les autres peuvent s'ajouter
CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.is_group = true
        AND (
          auth.uid() = conversation_participants.user_id
          OR c.group_creator_id = auth.uid()
        )
    )
  );

-- Explication :
-- - auth.uid() = user_id : on peut s'ajouter soi-même au groupe
-- - c.group_creator_id = auth.uid() : le créateur peut ajouter n'importe quel participant

-- 3. Rattraper les groupes existants sans participants
-- Si des groupes ont 0 membre à cause de l'ancienne politique, on ajoute le créateur.
-- (S'exécute avec les privilèges du rôle qui lance le script, ex. postgres / service_role)
INSERT INTO conversation_participants (conversation_id, user_id, is_active)
  SELECT c.id, c.group_creator_id, true
  FROM conversations c
  WHERE c.is_group = true
    AND c.group_creator_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = c.group_creator_id
    )
ON CONFLICT (conversation_id, user_id) DO NOTHING;
