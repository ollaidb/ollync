-- ============================================
-- SCRIPT POUR METTRE À JOUR LES SOUS-CATÉGORIES
-- ============================================
-- Ce script met à jour les sous-catégories :
-- - Ajoute "Live" dans Création de contenu
-- - Ajoute "YouTube vidéo" dans Casting
-- - Supprime "Live" de Casting
-- - Supprime "Aide Live / Modération" de Services
-- - Supprime "Pack compte + contenu" de Vente
-- Exécutez-le dans votre SQL Editor Supabase

-- Ajouter "Live" dans Création de contenu
INSERT INTO sub_categories (category_id, name, slug) 
SELECT id, 'Live', 'live'
FROM categories 
WHERE slug = 'creation-contenu'
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Ajouter "YouTube vidéo" dans Casting
INSERT INTO sub_categories (category_id, name, slug) 
SELECT id, 'YouTube vidéo', 'youtube-video'
FROM categories 
WHERE slug = 'casting-role'
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Supprimer "Live" de Casting
DELETE FROM sub_categories 
WHERE slug = 'live'
  AND category_id = (SELECT id FROM categories WHERE slug = 'casting-role');

-- Supprimer "Aide Live / Modération" de Services
DELETE FROM sub_categories 
WHERE slug = 'aide-live-moderation'
  AND category_id = (SELECT id FROM categories WHERE slug = 'services');

-- Supprimer "Pack compte + contenu" de Vente
DELETE FROM sub_categories 
WHERE slug = 'pack-compte-contenu'
  AND category_id = (SELECT id FROM categories WHERE slug = 'vente');

-- Vérification
SELECT 
  c.name as category_name,
  c.slug as category_slug,
  sc.name as subcategory_name,
  sc.slug as subcategory_slug
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
WHERE c.slug IN ('creation-contenu', 'casting-role', 'services', 'vente')
ORDER BY c.slug, sc.name;
