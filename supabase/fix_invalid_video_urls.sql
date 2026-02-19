-- =========================================================
-- Fix invalid placeholder video URLs in posts
-- =========================================================

BEGIN;

-- 1) Replace legacy/wrong Supabase host by current project host when path is usable
UPDATE public.posts
SET video = regexp_replace(
  video,
  '^https://[^/]+\\.supabase\\.co/',
  'https://abmtxvyycslskmnmlniq.supabase.co/'
)
WHERE video IS NOT NULL
  AND video ~ '^https://[^/]+\\.supabase\\.co/storage/v1/object/public/videos/.+'
  AND video NOT ILIKE '%TON USER ID%';

-- 2) Nullify placeholder demo URLs that can never resolve
UPDATE public.posts
SET video = NULL
WHERE video ILIKE '%ton-projet.supabase.co%'
   OR video ILIKE '%TON USER ID%'
   OR video ILIKE '%VOTRE_%';

COMMIT;
