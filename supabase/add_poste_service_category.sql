-- ============================================
-- AJOUT CATÉGORIE: POSTE/SERVICE
-- ============================================
-- Crée la catégorie "Poste/Service" et ses sous-catégories
-- Exécutez ce script dans le SQL Editor Supabase

-- 1) Ajouter/mettre à jour la catégorie
INSERT INTO categories (name, slug, icon, color)
VALUES ('Poste/Service', 'poste-service', 'Briefcase', '#f97316')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- 2) Ajouter les sous-catégories
DO $$
DECLARE
  poste_service_id UUID;
BEGIN
  SELECT id INTO poste_service_id FROM categories WHERE slug = 'poste-service';

  IF poste_service_id IS NULL THEN
    RAISE EXCEPTION 'Catégorie "poste-service" non trouvée';
  END IF;

  INSERT INTO sub_categories (category_id, name, slug)
  VALUES
    (poste_service_id, 'Prestation', 'prestation'),
    (poste_service_id, 'Food', 'food'),
    (poste_service_id, 'Lieux', 'lieux'),
    (poste_service_id, 'Autre', 'autre')
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;

-- 3) Vérification
SELECT
  c.name AS category,
  c.slug AS category_slug,
  sc.name AS subcategory,
  sc.slug AS subcategory_slug
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
WHERE c.slug = 'poste-service'
ORDER BY sc.slug;
