-- Bulk summaries for conversation list (last message + unread count)
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION get_conversation_summaries(
  conversation_ids uuid[],
  viewer_id uuid
)
RETURNS TABLE (
  conversation_id uuid,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  last_message_type text,
  unread_count integer
)
LANGUAGE sql
AS $$
  WITH last_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content,
      m.created_at,
      m.sender_id,
      m.message_type
    FROM messages m
    WHERE m.conversation_id = ANY (conversation_ids)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.conversation_id,
      COUNT(*)::int AS unread_count
    FROM messages m
    WHERE m.conversation_id = ANY (conversation_ids)
      AND m.read_at IS NULL
      AND m.sender_id IS DISTINCT FROM viewer_id
    GROUP BY m.conversation_id
  )
  SELECT
    lm.conversation_id,
    lm.content AS last_message_content,
    lm.created_at AS last_message_created_at,
    lm.sender_id AS last_message_sender_id,
    lm.message_type AS last_message_type,
    COALESCE(uc.unread_count, 0) AS unread_count
  FROM last_messages lm
  LEFT JOIN unread_counts uc ON uc.conversation_id = lm.conversation_id;
$$;
