-- ============================================
-- RPC: MARK MESSAGES AS READ FOR A CONVERSATION
-- ============================================
CREATE OR REPLACE FUNCTION mark_conversation_messages_read(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que l'utilisateur fait partie de la conversation
  IF NOT EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = p_conversation_id
      AND (
        c.user1_id = auth.uid()
        OR c.user2_id = auth.uid()
        OR c.group_creator_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
            AND cp.user_id = auth.uid()
            AND COALESCE(cp.is_active, true) = true
        )
      )
  ) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
