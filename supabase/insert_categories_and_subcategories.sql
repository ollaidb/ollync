-- ============================================
-- SCRIPT POUR INSÉRER LES CATÉGORIES ET SOUS-CATÉGORIES
-- ============================================
-- Ce script insère toutes les catégories et sous-catégories par défaut
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
-- INSÉRER LES CATÉGORIES
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
-- INSÉRER LES SOUS-CATÉGORIES
-- ============================================

-- Match
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'match'), 'Création de contenu', 'creation-contenu'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Sortie', 'sortie'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Événement', 'evenement')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Recrutement
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Modèle', 'modele'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Figurant', 'figurant')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Projet
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'projet'), 'Associer / Collaboration', 'associer-collaboration')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Service
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'service'), 'Échange de service', 'echange-service'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Tâches', 'taches'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Formation', 'formation')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Vente
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Échange', 'echange'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Vente de compte', 'vente-compte'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Gratuit', 'gratuit'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Matériel', 'gorille')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Mission
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Colis', 'colis'),
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Vérification', 'verification')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Studio & lieu
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

-- Autre
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'autre'), 'Non classé', 'non-classe'),
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

