-- Ajout de la durée estimée (en minutes)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
