-- Ajouter les champs pour le statut de profil et les catégories d'affichage
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT,
  ADD COLUMN IF NOT EXISTS display_categories TEXT[];

-- Optionnel: valeur par defaut
-- ALTER TABLE profiles ALTER COLUMN display_categories SET DEFAULT '{}';
