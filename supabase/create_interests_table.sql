-- Table des intérêts (swipe à droite)
-- Cette table stocke les posts qui intéressent l'utilisateur
-- Différent des likes : c'est pour le système de matching

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_post_id ON interests(post_id);
CREATE INDEX IF NOT EXISTS idx_interests_created_at ON interests(created_at);

-- RLS (Row Level Security)
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own interests" ON interests;
DROP POLICY IF EXISTS "Users can create their own interests" ON interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON interests;
DROP POLICY IF EXISTS "Post owners can view interests on their posts" ON interests;

-- Politique : les utilisateurs peuvent voir leurs propres intérêts
CREATE POLICY "Users can view their own interests"
  ON interests FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent créer leurs propres intérêts
CREATE POLICY "Users can create their own interests"
  ON interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent supprimer leurs propres intérêts
CREATE POLICY "Users can delete their own interests"
  ON interests FOR DELETE
  USING (auth.uid() = user_id);

-- Politique : les propriétaires de posts peuvent voir qui s'intéresse à leurs posts
CREATE POLICY "Post owners can view interests on their posts"
  ON interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = interests.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Fonction pour créer un match automatique
-- Un match se produit quand le propriétaire du post swipe aussi à droite sur le profil de l'utilisateur
-- (nécessite une table matches si vous voulez implémenter cela)

COMMENT ON TABLE interests IS 'Stores user interests in posts (swipe right actions)';
COMMENT ON COLUMN interests.user_id IS 'User who showed interest';
COMMENT ON COLUMN interests.post_id IS 'Post that user is interested in';

