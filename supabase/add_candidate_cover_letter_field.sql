-- Ajoute le champ de fichier lettre de motivation dans profiles
-- Exécuter dans Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS candidate_cover_letter_url text;

