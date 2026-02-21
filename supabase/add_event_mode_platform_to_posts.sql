-- ============================================
-- AJOUT CHAMPS ÉVÉNEMENT: MODE + PLATEFORME
-- ============================================
-- But:
-- 1) Permettre de distinguer un événement "présentiel" vs "à distance"
-- 2) Stocker la plateforme (Zoom, Meet, etc.) uniquement pour les événements à distance

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS event_mode VARCHAR(20);

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS event_platform TEXT;

-- Contrainte de cohérence sur event_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_event_mode_check'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_event_mode_check
    CHECK (event_mode IS NULL OR event_mode IN ('in_person', 'remote'));
  END IF;
END $$;

-- Optionnel: nettoyer les données invalides existantes
UPDATE posts
SET event_mode = NULL
WHERE event_mode IS NOT NULL
  AND event_mode NOT IN ('in_person', 'remote');

-- Vérification rapide
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name IN ('event_mode', 'event_platform')
ORDER BY column_name;
