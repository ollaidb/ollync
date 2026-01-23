-- ============================================
-- ADD DELETE FOR ALL FLAGS TO MESSAGES
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted_for_all BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_all_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_for_all
  ON messages(is_deleted_for_all) WHERE is_deleted_for_all = true;
