-- ============================================
-- SCRIPT DE SAUVEGARDE AVANT MIGRATION
-- ============================================
-- Exécutez ce script AVANT d'exécuter migrate_to_new_categories.sql
-- pour créer une sauvegarde de l'état actuel

-- Supprimer les tables de sauvegarde si elles existent déjà
DROP TABLE IF EXISTS categories_backup CASCADE;
DROP TABLE IF EXISTS sub_categories_backup CASCADE;
DROP TABLE IF EXISTS posts_categories_backup CASCADE;

-- Créer une table temporaire pour sauvegarder les catégories
CREATE TABLE categories_backup AS
SELECT * FROM categories;

-- Créer une table temporaire pour sauvegarder les sous-catégories
CREATE TABLE sub_categories_backup AS
SELECT * FROM sub_categories;

-- Créer une table temporaire pour sauvegarder les posts avec leurs catégories
CREATE TABLE posts_categories_backup AS
SELECT 
  p.id as post_id,
  p.category_id,
  c.slug as category_slug,
  p.sub_category_id,
  sc.slug as sub_category_slug
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id;

-- Afficher un résumé de la sauvegarde
SELECT 
  'Categories sauvegardées' as type,
  COUNT(*) as count
FROM categories_backup
UNION ALL
SELECT 
  'Sub-categories sauvegardées' as type,
  COUNT(*) as count
FROM sub_categories_backup
UNION ALL
SELECT 
  'Posts sauvegardés' as type,
  COUNT(*) as count
FROM posts_categories_backup;

