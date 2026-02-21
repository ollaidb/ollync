-- ============================================
-- AJOUT SOUS-CATÉGORIES: SERVICES / MISSION
-- ============================================
-- Ajoute les sous-catégories demandées à la catégorie "services"

DO $$
DECLARE
  services_category_id UUID;
BEGIN
  SELECT id INTO services_category_id
  FROM categories
  WHERE slug = 'services';

  IF services_category_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "services" non trouvée';
  END IF;

  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (services_category_id, 'Visage de marque', 'visage-marque'),
    (services_category_id, 'Animation de compte', 'animation-compte')
  ON CONFLICT (category_id, slug) DO UPDATE
  SET name = EXCLUDED.name;
END $$;

-- Vérification
SELECT
  c.name AS category,
  c.slug AS category_slug,
  sc.name AS subcategory,
  sc.slug AS subcategory_slug
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
WHERE c.slug = 'services'
  AND sc.slug IN ('visage-marque', 'animation-compte')
ORDER BY sc.slug;
