-- ============================================
-- TABLE DES CENTRES D'INTÉRÊT DES UTILISATEURS
-- ============================================
-- Cette table stocke les catégories d'intérêt des utilisateurs (centres d'intérêt)
-- Relation many-to-many entre profiles et categories
-- Si un utilisateur sélectionne toutes les catégories, il apparaît partout
-- Si un utilisateur sélectionne seulement certaines catégories, il n'apparaît que dans ces catégories

CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_category_id ON user_interests(category_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_created_at ON user_interests(created_at);

-- Index composite pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_user_interests_user_category ON user_interests(user_id, category_id);

-- RLS (Row Level Security)
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view all user interests" ON user_interests;
DROP POLICY IF EXISTS "Users can view their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can create their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;

-- Politique : tous les utilisateurs peuvent voir tous les centres d'intérêt (pour le filtrage)
CREATE POLICY "Users can view all user interests"
  ON user_interests FOR SELECT
  USING (true);

-- Politique : les utilisateurs peuvent créer leurs propres centres d'intérêt
CREATE POLICY "Users can create their own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs propres centres d'intérêt
CREATE POLICY "Users can update their own interests"
  ON user_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent supprimer leurs propres centres d'intérêt
CREATE POLICY "Users can delete their own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaire sur la table
COMMENT ON TABLE user_interests IS 'Stoque les centres d''intérêt des utilisateurs (catégories sélectionnées). Si un utilisateur a toutes les catégories ou aucune catégorie, il apparaît partout. Sinon, il n''apparaît que dans ses catégories sélectionnées.';
