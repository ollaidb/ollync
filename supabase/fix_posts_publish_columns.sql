-- =====================================================
-- FIX: Colonnes manquantes pour publication (table posts)
-- =====================================================
-- Erreur vue: Could not find the 'location_address' column of 'posts' in the schema cache

ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_visible_to_participants_only BOOLEAN DEFAULT FALSE;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_mode VARCHAR(20);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_platform TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_event_mode_check'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_event_mode_check
    CHECK (event_mode IS NULL OR event_mode IN ('in_person', 'remote'));
  END IF;
END $$;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name IN (
    'location_address',
    'location_city',
    'location_lat',
    'location_lng',
    'location_visible_to_participants_only',
    'event_mode',
    'event_platform'
  )
ORDER BY column_name;
