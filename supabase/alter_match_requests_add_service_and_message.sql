-- ============================================
-- ADD SERVICE AND MESSAGE FIELDS TO MATCH_REQUESTS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'related_service_name'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN related_service_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'related_service_description'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN related_service_description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'related_service_payment_type'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN related_service_payment_type VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'related_service_value'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN related_service_value TEXT;
  END IF;

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
