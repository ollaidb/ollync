-- ============================================
-- MIGRATION VERS LES NOUVELLES CATÉGORIES
-- ============================================
-- Script pour migrer la base de données vers le nouveau concept
-- centré sur les créateurs de contenu
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 1 : CRÉER LES NOUVELLES CATÉGORIES
-- ============================================

-- D'abord, mettre à jour les noms des anciennes catégories qui ont le même nom
-- pour éviter les conflits de contrainte unique sur "name"
UPDATE categories 
SET name = name || ' (ancien)', 
    updated_at = NOW()
WHERE slug IN ('projet', 'service') 
  AND name IN ('Projet', 'Service', 'Services');

-- Insérer/mettre à jour les nouvelles catégories (utilise slug comme clé unique)
INSERT INTO categories (name, slug, icon, color) VALUES
  ('Création de contenu', 'creation-contenu', 'Camera', '#667eea'),
  ('Casting', 'casting-role', 'Users', '#2196f3'),
  ('Emploi', 'montage', 'Scissors', '#9c27b0'),
  ('Projet', 'projets-equipe', 'Briefcase', '#4facfe'),
  ('Services', 'services', 'Wrench', '#43e97b'),
  ('Vente', 'vente', 'ShoppingBag', '#f093fb')
ON CONFLICT (name) DO UPDATE
SET slug = EXCLUDED.slug,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- ============================================
-- ÉTAPE 2 : MIGRER LES POSTS EXISTANTS
-- ============================================

-- Migrer les posts de "match" vers "creation-contenu" (si match existe)
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'match';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'creation-contenu';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
    RAISE NOTICE 'Migré % posts de match vers creation-contenu', (SELECT COUNT(*) FROM posts WHERE category_id = new_category_id);
  END IF;
END $$;

-- Migrer les posts de "communication" vers "creation-contenu" (si communication existe)
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'communication';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'creation-contenu';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
  END IF;
END $$;

-- Migrer les posts de "recrutement" ou "role" vers "casting-role"
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO new_category_id FROM categories WHERE slug = 'casting-role';
  
  -- Migrer recrutement
  SELECT id INTO old_category_id FROM categories WHERE slug = 'recrutement';
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts SET category_id = new_category_id WHERE category_id = old_category_id;
  END IF;
  
  -- Migrer role
  SELECT id INTO old_category_id FROM categories WHERE slug = 'role';
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts SET category_id = new_category_id WHERE category_id = old_category_id;
  END IF;
END $$;

-- Migrer les posts de "mission" vers "montage" (Emploi)
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'mission';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'montage';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
  END IF;
END $$;

-- Migrer les posts de "service" vers "services" (nouveau slug)
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'service';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'services';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
  END IF;
END $$;

-- Migrer les posts de "projet" vers "projets-equipe" (nouveau slug)
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'projet';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'projets-equipe';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
  END IF;
END $$;

-- Pour les posts de "autre", migrer vers "services" comme catégorie générale
DO $$
DECLARE
  old_category_id UUID;
  new_category_id UUID;
BEGIN
  SELECT id INTO old_category_id FROM categories WHERE slug = 'autre';
  SELECT id INTO new_category_id FROM categories WHERE slug = 'services';
  
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    UPDATE posts
    SET category_id = new_category_id
    WHERE category_id = old_category_id;
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : SUPPRIMER LES ANCIENNES CATÉGORIES
-- ============================================

-- Supprimer les sous-catégories des anciennes catégories avant de supprimer les catégories
DELETE FROM sub_categories
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE slug IN ('match', 'recrutement', 'role', 'mission', 'autre', 'communication', 'service', 'projet')
  AND id NOT IN (SELECT DISTINCT category_id FROM posts WHERE category_id IS NOT NULL)
);

-- Supprimer les anciennes catégories (seulement si aucun post ne les utilise)
-- Note: Grâce à la migration précédente, toutes les catégories devraient être vides
DELETE FROM categories
WHERE slug IN ('match', 'recrutement', 'role', 'mission', 'autre', 'communication', 'service', 'projet')
AND id NOT IN (SELECT DISTINCT category_id FROM posts WHERE category_id IS NOT NULL);

-- ============================================
-- ÉTAPE 4 : SUPPRIMER LES ANCIENNES SOUS-CATÉGORIES
-- ============================================

-- Supprimer toutes les sous-catégories existantes pour repartir proprement
DELETE FROM sub_categories;

-- ============================================
-- ÉTAPE 5 : INSÉRER LES NOUVELLES SOUS-CATÉGORIES
-- ============================================

-- 1. Création de contenu
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Photo', 'photo'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Vidéo', 'video'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Vlog', 'vlog'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Sketchs', 'sketchs'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Trends', 'trends'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Événements', 'evenements'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Live', 'live'),
  ((SELECT id FROM categories WHERE slug = 'creation-contenu'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 2. Casting
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Figurant', 'figurant'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Modèle photo', 'modele-photo'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Modèle vidéo', 'modele-video'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Voix off', 'voix-off'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Invité podcast', 'invite-podcast'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Invité micro-trottoir', 'invite-micro-trottoir'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'YouTube vidéo', 'youtube-video'),
  ((SELECT id FROM categories WHERE slug = 'casting-role'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 3. Emploi (montage)
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'montage'), 'Montage', 'montage'),
  ((SELECT id FROM categories WHERE slug = 'montage'), 'micro-trottoir', 'micro-trottoir'),
  ((SELECT id FROM categories WHERE slug = 'montage'), 'live', 'live'),
  ((SELECT id FROM categories WHERE slug = 'montage'), 'Écriture de contenu', 'ecriture-contenu'),
  ((SELECT id FROM categories WHERE slug = 'montage'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 4. Projet (projets-equipe)
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Émission', 'projet-emission'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Newsletter', 'projet-newsletter'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Interview', 'projet-interview'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Podcast', 'projet-podcast'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Chaîne YouTube', 'projet-youtube'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Magazine', 'projet-magazine'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Blog', 'projet-blog'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Média', 'projet-media'),
  ((SELECT id FROM categories WHERE slug = 'projets-equipe'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 5. Services
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'services'), 'Coaching contenu', 'coaching-contenu'),
  ((SELECT id FROM categories WHERE slug = 'services'), 'Stratégie éditoriale', 'strategie-editoriale'),
  ((SELECT id FROM categories WHERE slug = 'services'), 'Organisation', 'organisation'),
  ((SELECT id FROM categories WHERE slug = 'services'), 'Setup matériel', 'setup-materiel'),
  ((SELECT id FROM categories WHERE slug = 'services'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 6. Vente
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Comptes', 'comptes'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Noms d''utilisateur', 'noms-utilisateur'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Concepts / Niches', 'concepts-niches'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- ============================================
-- ÉTAPE 6.5 : RÉINITIALISER LES SUB_CATEGORY_ID DES POSTS
-- ============================================
-- Mettre à NULL les sub_category_id des posts car les sous-catégories ont changé
-- Les utilisateurs devront peut-être réassigner manuellement leurs sous-catégories
UPDATE posts
SET sub_category_id = NULL
WHERE sub_category_id IS NOT NULL;

-- ============================================
-- ÉTAPE 6 : VÉRIFICATION
-- ============================================

-- Afficher toutes les catégories et leurs sous-catégories
SELECT 
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  c.color as category_color,
  sc.name as subcategory_name,
  sc.slug as subcategory_slug,
  (SELECT COUNT(*) FROM posts WHERE category_id = c.id) as posts_count
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
ORDER BY 
  CASE c.slug
    WHEN 'creation-contenu' THEN 1
    WHEN 'casting-role' THEN 2
    WHEN 'montage' THEN 3
    WHEN 'projets-equipe' THEN 4
    WHEN 'services' THEN 5
    WHEN 'vente' THEN 6
    ELSE 7
  END,
  sc.name;

-- ============================================
-- ÉTAPE 7 : STATISTIQUES DE MIGRATION
-- ============================================

-- Afficher le nombre de posts par catégorie après migration
SELECT 
  c.name as category_name,
  c.slug as category_slug,
  COUNT(p.id) as total_posts
FROM categories c
LEFT JOIN posts p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY total_posts DESC;

