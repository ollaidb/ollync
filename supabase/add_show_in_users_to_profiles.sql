-- Contrôle d'affichage du profil dans la page Utilisateurs
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_in_users BOOLEAN;

-- Valeur par défaut: profil visible
ALTER TABLE profiles
  ALTER COLUMN show_in_users SET DEFAULT true;

-- Backfill des profils existants
UPDATE profiles
SET show_in_users = true
WHERE show_in_users IS NULL;

-- Rendre la colonne obligatoire après backfill
ALTER TABLE profiles
  ALTER COLUMN show_in_users SET NOT NULL;
