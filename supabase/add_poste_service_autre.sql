-- ============================================
-- AJOUT SOUS-CATÉGORIE "AUTRE" POUR POSTE/SERVICE
-- ============================================

DO $$
DECLARE
  poste_service_id UUID;
BEGIN
  SELECT id INTO poste_service_id FROM categories WHERE slug = 'poste-service';

  IF poste_service_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "poste-service" non trouvée';
  END IF;

  INSERT INTO sub_categories (category_id, name, slug)
  VALUES (poste_service_id, 'Autre', 'autre')
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
WHERE c.slug = 'poste-service'
ORDER BY sc.slug;
