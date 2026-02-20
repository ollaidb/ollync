-- Champs candidature dans profiles
-- Exécuter dans Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS candidate_cv_url text,
ADD COLUMN IF NOT EXISTS candidate_skills text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS candidate_motivation text;

