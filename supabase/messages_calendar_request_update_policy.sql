-- ============================================
-- Rendez-vous : permettre modification du message par les deux en 1-to-1,
-- et par le créateur ou les admins en groupe
-- ============================================
-- À exécuter dans le SQL Editor Supabase.
-- Les politiques UPDATE sur messages sont en OR : l'expéditeur peut déjà
-- modifier ses messages. On ajoute une politique pour que les participants
-- puissent modifier les messages de type calendar_request :
-- - en conversation 1-to-1 : les deux participants peuvent modifier (date/heure/durée) ;
-- - en groupe : seul un participant avec rôle 'moderator' (admin) peut modifier
--   (le créateur du RDV est déjà autorisé via sender_id = auth.uid()).
-- ============================================

DROP POLICY IF EXISTS "Participants can update calendar_request messages" ON messages;

CREATE POLICY "Participants can update calendar_request messages"
ON messages
FOR UPDATE
USING (
  message_type = 'calendar_request'
  AND (
    -- Participant en groupe (créateur déjà couvert par messages_update) ou en 1-to-1 via conversation_participants
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      JOIN conversations c ON c.id = cp.conversation_id
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
        AND (c.is_group = false OR cp.role = 'moderator')
    )
    -- 1-to-1 : user1_id / user2_id (si pas de lignes dans conversation_participants)
    OR EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.is_group = false OR c.is_group IS NULL)
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
);
