-- Projection views for messaging (read-only)
-- Assumes RLS policies for conversations/messages are already configured

CREATE OR REPLACE VIEW public_messages_with_sender AS
SELECT
  m.*,
  jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
  ) AS sender
FROM messages m
LEFT JOIN profiles p ON p.id = m.sender_id;

CREATE OR REPLACE VIEW public_conversations_with_users AS
SELECT
  c.*,
  jsonb_build_object(
    'id', u1.id,
    'username', u1.username,
    'full_name', u1.full_name,
    'avatar_url', u1.avatar_url
  ) AS user1,
  jsonb_build_object(
    'id', u2.id,
    'username', u2.username,
    'full_name', u2.full_name,
    'avatar_url', u2.avatar_url
  ) AS user2
FROM conversations c
LEFT JOIN profiles u1 ON u1.id = c.user1_id
LEFT JOIN profiles u2 ON u2.id = c.user2_id;
