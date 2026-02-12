-- Ajout de l'heure de besoin
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS needed_time TEXT;
