-- Colonnes nécessaires pour la page Utilisateurs (profils publics, rôles, visibilité)
-- Idempotent : peut être exécuté plusieurs fois sans erreur

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT,
  ADD COLUMN IF NOT EXISTS display_categories TEXT[],
  ADD COLUMN IF NOT EXISTS display_subcategories TEXT[],
  ADD COLUMN IF NOT EXISTS show_in_users BOOLEAN;

-- Valeur par défaut pour show_in_users (profils visibles dans la page Utilisateurs)
UPDATE public.profiles
SET show_in_users = true
WHERE show_in_users IS NULL;

COMMENT ON COLUMN public.profiles.profile_type IS 'Type(s) de profil (ex: creator, freelance), séparés par || ou JSON array';
COMMENT ON COLUMN public.profiles.display_categories IS 'Catégories d''affichage du profil (slugs)';
COMMENT ON COLUMN public.profiles.display_subcategories IS 'Sous-catégories d''affichage (format category_slug::subcategory_slug)';
COMMENT ON COLUMN public.profiles.show_in_users IS 'Afficher le profil dans la page Utilisateurs';
