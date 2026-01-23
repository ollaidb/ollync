-- ============================================
-- AJOUT DES COLONNES DE MODERATION TEXTE
-- ============================================
-- Ajoute des champs de moderation pour les posts
-- Exécutez ce script dans votre SQL Editor Supabase

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Optionnel : index pour filtrer rapidement les posts bloques/flagges
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
