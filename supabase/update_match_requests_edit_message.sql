-- ============================================
-- ENABLE EDITING REQUEST_MESSAGE FOR SENDERS
-- ============================================

-- Ensure request_message column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'request_message'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN request_message TEXT;
  END IF;
END $$;

-- Ensure updated_at exists and stays in sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_match_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_match_requests_updated_at ON match_requests;
CREATE TRIGGER trigger_update_match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_match_requests_updated_at();

-- RLS: allow sender to update their request_message and receiver to read
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own match requests" ON match_requests;
CREATE POLICY "Users can update their own match requests"
  ON match_requests FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);
