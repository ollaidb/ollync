-- ============================================
-- AJOUT SOUS-CATÉGORIES: STUDIO & LIEU
-- ============================================
-- Ajoute les sous-catégories demandées à la catégorie "studio-lieu"

DO $$
DECLARE
  studio_lieu_id UUID;
BEGIN
  SELECT id INTO studio_lieu_id FROM categories WHERE slug = 'studio-lieu';

  IF studio_lieu_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "studio-lieu" non trouvée';
  END IF;

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
