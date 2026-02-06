-- Permet de supprimer un message "pour moi" même si je ne suis pas l'expéditeur
-- A exécuter dans Supabase (SQL Editor).

CREATE OR REPLACE FUNCTION delete_message_for_user(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT conversation_id INTO v_conversation_id
  FROM messages
  WHERE id = p_message_id;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message introuvable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = auth.uid()
      AND COALESCE(is_active, true) = true
  ) AND NOT EXISTS (
    SELECT 1
    FROM conversations
    WHERE id = v_conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE messages
  SET is_deleted = true,
      deleted_for_user_id = auth.uid()
  WHERE id = p_message_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_message_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_message_for_user(UUID) TO authenticated;
