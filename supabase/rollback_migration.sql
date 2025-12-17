-- ============================================
-- SCRIPT DE ROLLBACK DE LA MIGRATION
-- ============================================
-- Utilisez ce script pour revenir en arrière si nécessaire
-- Nécessite que backup_before_migration.sql ait été exécuté avant

-- Restaurer les catégories
DELETE FROM categories;
INSERT INTO categories SELECT * FROM categories_backup;

-- Restaurer les sous-catégories
DELETE FROM sub_categories;
INSERT INTO sub_categories SELECT * FROM sub_categories_backup;

-- Restaurer les catégories des posts
UPDATE posts p
SET 
  category_id = pcb.category_id,
  sub_category_id = pcb.sub_category_id
FROM posts_categories_backup pcb
WHERE p.id = pcb.post_id;

-- Vérification
SELECT 
  'Categories restaurées' as type,
  COUNT(*) as count
FROM categories
UNION ALL
SELECT 
  'Sub-categories restaurées' as type,
  COUNT(*) as count
FROM sub_categories;

-- Note: Les tables de sauvegarde peuvent être supprimées après vérification
-- DROP TABLE IF EXISTS categories_backup;
-- DROP TABLE IF EXISTS sub_categories_backup;
-- DROP TABLE IF EXISTS posts_categories_backup;

