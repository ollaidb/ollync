-- Ajout des champs pour niveau et rôles recherchés
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS profile_level TEXT,
  ADD COLUMN IF NOT EXISTS profile_roles TEXT[];
