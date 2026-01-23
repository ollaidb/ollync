-- ============================================
-- ENSURE UNIQUE DIRECT CONVERSATIONS PER USER PAIR
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Regrouper les conversations directes dupliquées
WITH direct_pairs AS (
  SELECT
    LEAST(user1_id, user2_id) AS user_low,
    GREATEST(user1_id, user2_id) AS user_high,
    ARRAY_AGG(id ORDER BY last_message_at DESC NULLS LAST, created_at DESC) AS ids
  FROM conversations
  WHERE is_group = false
    AND user1_id IS NOT NULL
    AND user2_id IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 1
),
pair_keeps AS (
  SELECT
    user_low,
    user_high,
    ids[1] AS keep_id,
    ids[2:array_length(ids, 1)] AS drop_ids
  FROM direct_pairs
),
all_drops AS (
  SELECT keep_id, UNNEST(drop_ids) AS drop_id
  FROM pair_keeps
)
UPDATE messages m
SET conversation_id = d.keep_id
FROM all_drops d
WHERE m.conversation_id = d.drop_id;

WITH direct_pairs AS (
  SELECT
    LEAST(user1_id, user2_id) AS user_low,
    GREATEST(user1_id, user2_id) AS user_high,
    ARRAY_AGG(id ORDER BY last_message_at DESC NULLS LAST, created_at DESC) AS ids
  FROM conversations
  WHERE is_group = false
    AND user1_id IS NOT NULL
    AND user2_id IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 1
),
pair_keeps AS (
  SELECT
    user_low,
    user_high,
    ids[1] AS keep_id,
    ids[2:array_length(ids, 1)] AS drop_ids
  FROM direct_pairs
),
all_drops AS (
  SELECT keep_id, UNNEST(drop_ids) AS drop_id
  FROM pair_keeps
)
UPDATE match_requests mr
SET conversation_id = d.keep_id
FROM all_drops d
WHERE mr.conversation_id = d.drop_id;

WITH direct_pairs AS (
  SELECT
    LEAST(user1_id, user2_id) AS user_low,
    GREATEST(user1_id, user2_id) AS user_high,
    ARRAY_AGG(id ORDER BY last_message_at DESC NULLS LAST, created_at DESC) AS ids
  FROM conversations
  WHERE is_group = false
    AND user1_id IS NOT NULL
    AND user2_id IS NOT NULL
    AND deleted_at IS NULL
  GROUP BY 1, 2
  HAVING COUNT(*) > 1
),
pair_keeps AS (
  SELECT
    ids[1] AS keep_id,
    ids[2:array_length(ids, 1)] AS drop_ids
  FROM direct_pairs
),
all_drops AS (
  SELECT keep_id, UNNEST(drop_ids) AS drop_id
  FROM pair_keeps
)
UPDATE conversations c
SET deleted_at = NOW()
FROM all_drops d
WHERE c.id = d.drop_id;

-- Contrainte d'unicité par paire (conversations directes actives)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair_active
  ON conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
  WHERE is_group = false
    AND deleted_at IS NULL
    AND user1_id IS NOT NULL
    AND user2_id IS NOT NULL;
