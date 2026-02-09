-- Performance indexes for posts and messaging
-- Safe to run multiple times

-- Fuzzy search acceleration (used by ILIKE in Search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Posts: feed and filters
CREATE INDEX IF NOT EXISTS idx_posts_status_created_at
  ON posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_category_created_at
  ON posts (category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_sub_category_created_at
  ON posts (sub_category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_listing_type_created_at
  ON posts (listing_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_created_at
  ON posts (user_id, created_at DESC);

-- Posts: text search fields
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON posts USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_description_trgm
  ON posts USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_posts_location_trgm
  ON posts USING GIN (location gin_trgm_ops);

-- Messages: conversation lists and history
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at
  ON messages (sender_id, created_at DESC);

-- Conversations: inbox ordering
CREATE INDEX IF NOT EXISTS idx_conversations_user1_last_message_at
  ON conversations (user1_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user2_last_message_at
  ON conversations (user2_id, last_message_at DESC);
