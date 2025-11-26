-- ============================================
-- CRÉATION DE LA TABLE LIKES
-- ============================================
-- Table pour permettre aux utilisateurs de liker les annonces
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des likes
-- Permet aux utilisateurs de liker les annonces
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)  -- Un utilisateur ne peut liker une annonce qu'une seule fois
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Activer RLS (Row Level Security)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies pour les likes
-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Tout le monde peut voir les likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

-- Les utilisateurs peuvent créer leurs propres likes
CREATE POLICY "Users can create their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour le compteur de likes sur les posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le compteur de likes
DROP TRIGGER IF EXISTS update_likes_count ON likes;
CREATE TRIGGER update_likes_count 
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW 
  EXECUTE FUNCTION update_post_likes_count();

