ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_subcategories TEXT[];

COMMENT ON COLUMN profiles.display_subcategories IS
'Sous-catégories d’affichage du profil au format category_slug::subcategory_slug (multi-sélection)';
