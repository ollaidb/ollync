-- ============================================
-- CONVERSATION USER STATES (ARCHIVE / PIN / DELETE PER USER)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_user_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_user_states_user_id ON conversation_user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_user_states_conversation_id ON conversation_user_states(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_user_states_archived ON conversation_user_states(is_archived) WHERE is_archived = true;

-- Un seul pin par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_user_states_pin_unique
  ON conversation_user_states(user_id)
  WHERE is_pinned = true AND deleted_at IS NULL;

ALTER TABLE conversation_user_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversation states" ON conversation_user_states;
DROP POLICY IF EXISTS "Users can create their conversation states" ON conversation_user_states;
DROP POLICY IF EXISTS "Users can update their conversation states" ON conversation_user_states;

CREATE POLICY "Users can view their conversation states"
  ON conversation_user_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their conversation states"
  ON conversation_user_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their conversation states"
  ON conversation_user_states FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_conversation_user_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_user_states_updated_at ON conversation_user_states;
CREATE TRIGGER trigger_update_conversation_user_states_updated_at
  BEFORE UPDATE ON conversation_user_states
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_user_states_updated_at();
