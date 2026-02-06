-- ============================================
-- SCRIPT POUR METTRE À JOUR LES SOUS-CATÉGORIES
-- ============================================
-- Ce script met à jour toutes les sous-catégories selon la nouvelle structure
-- Exécutez-le dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- S'assurer que les tables existent
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- ============================================
-- INSÉRER/METTRE À JOUR LES CATÉGORIES
-- ============================================
INSERT INTO categories (name, slug, icon, color) VALUES
  ('Match', 'match', 'Users', '#667eea'),
  ('Recrutement', 'recrutement', 'Briefcase', '#9c27b0'),
  ('Projet', 'projet', 'Briefcase', '#2196f3'),
  ('Service', 'service', 'Wrench', '#4facfe'),
  ('Vente', 'vente', 'ShoppingBag', '#f093fb'),
  ('Mission', 'mission', 'Target', '#43e97b'),
  ('Studio & lieu', 'studio-lieu', 'Building2', '#f59e0b'),
  ('Autre', 'autre', 'MoreHorizontal', '#ffa726')
ON CONFLICT (name) DO UPDATE
SET slug = EXCLUDED.slug,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- ============================================
-- SUPPRIMER LES ANCIENNES SOUS-CATÉGORIES
-- ============================================
-- Supprimer les sous-catégories qui ne sont plus dans la nouvelle structure
DELETE FROM sub_categories 
WHERE (category_id, slug) IN (
  -- Match : supprimer les anciennes qui ne sont plus utilisées
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'match' 
    AND sc.slug NOT IN ('creation-contenu', 'plus-one', 'evenements', 'creation-contenu-photo', 'creation-contenu-video')
  
  UNION ALL
  
  -- Recrutement : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'recrutement'
    AND sc.slug NOT IN ('modele', 'figurant', 'live', 'vlog', 'copywriting', 'montage-video')
  
  UNION ALL
  
  -- Projet : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'projet'
    AND sc.slug NOT IN ('association-collaboration')
  
  UNION ALL
  
  -- Service : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'service'
    AND sc.slug NOT IN ('echange-service', 'taches', 'formation')
  
  UNION ALL
  
  -- Vente : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'vente'
    AND sc.slug NOT IN ('echange', 'vente-comptes', 'don', 'gorille')
  
  UNION ALL
  
  -- Mission : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'mission'
    AND sc.slug NOT IN ('livraison', 'verification', 'cuisine')
  
  UNION ALL
  
  -- Autre : supprimer les anciennes
  SELECT sc.category_id, sc.slug
  FROM sub_categories sc
  JOIN categories c ON sc.category_id = c.id
  WHERE c.slug = 'autre'
    AND sc.slug NOT IN ('autre-service')
);

-- ============================================
-- INSÉRER/METTRE À JOUR LES NOUVELLES SOUS-CATÉGORIES
-- ============================================

-- 1. Match (👥)
-- Rencontres utiles : créatif, social ou événementiel
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'match'), 'Création de contenu', 'creation-contenu'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Plus One', 'plus-one'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Événements', 'evenements'),
  -- Sous-sous-menus pour Création de contenu
  ((SELECT id FROM categories WHERE slug = 'match'), 'Photo', 'creation-contenu-photo'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Vidéo', 'creation-contenu-video')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 2. Recrutement (✓)
-- Trouver des profils pour un projet ou une production
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Modèles', 'modele'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Figurants', 'figurant'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Live', 'live'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Vlog', 'vlog'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Copywriting', 'copywriting'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Montage vidéo', 'montage-video')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 3. Projet (💼)
-- Trouver un associé, un collaborateur ou rejoindre un projet
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'projet'), 'Association / Collaboration', 'association-collaboration')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 4. Service (🔧)
-- Échange de compétences, petites tâches, formations
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'service'), 'Échange de service', 'echange-service'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Tâches', 'taches'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Formation', 'formation')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 5. Vente (🛒)
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Échange', 'echange'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Vente de comptes', 'vente-comptes'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Don', 'don'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Matériel', 'gorille')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 6. Mission (📦)
-- Livraison, vérification, cuisine
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Livraison', 'livraison'),
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Vérification', 'verification'),
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Cuisine', 'cuisine')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 7. Studio & lieu
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Studio photo', 'studio-photo'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Studio vidéo', 'studio-video'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Studio', 'studio'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Appartement', 'appartement'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Maison', 'maison'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Bureau', 'bureau'),
  ((SELECT id FROM categories WHERE slug = 'studio-lieu'), 'Autre', 'autre')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- 8. Autre (⋯)
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'autre'), 'Autre service', 'autre-service')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Afficher toutes les catégories et leurs sous-catégories
SELECT 
  c.name as category_name,
  c.slug as category_slug,
  sc.name as subcategory_name,
  sc.slug as subcategory_slug,
  sc.id as subcategory_id
FROM categories c
LEFT JOIN sub_categories sc ON sc.category_id = c.id
ORDER BY c.name, sc.name;






