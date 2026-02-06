-- ============================================
-- REMPLACER SOUS-CATÉGORIES: STUDIO & LIEU
-- ============================================
-- Supprime les autres sous-catégories et garde uniquement :
--  - Studio de création
--  - Lieux résidentiels
--  - Lieux professionnels

DO $$
DECLARE
  studio_lieu_id UUID;
BEGIN
  SELECT id INTO studio_lieu_id FROM categories WHERE slug = 'studio-lieu';

  IF studio_lieu_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "studio-lieu" non trouvée';
  END IF;

  -- Supprimer toutes les sous-catégories existantes de studio-lieu
  DELETE FROM sub_categories
  WHERE category_id = studio_lieu_id;

  -- Réinsérer uniquement les 3 sous-catégories demandées
  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (studio_lieu_id, 'Studio de création', 'studio-creation'),
    (studio_lieu_id, 'Lieux résidentiels', 'lieux-residentiels'),
    (studio_lieu_id, 'Lieux professionnels', 'lieux-professionnels')
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;

-- Vérification
SELECT
  c.name AS category,
  c.slug AS category_slug,
  sc.name AS subcategory,
  sc.slug AS subcategory_slug
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
WHERE c.slug = 'studio-lieu'
ORDER BY sc.slug;
