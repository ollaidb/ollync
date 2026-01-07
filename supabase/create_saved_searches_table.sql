-- Script pour créer la table saved_searches
-- Cette table permet aux utilisateurs de sauvegarder leurs recherches

-- Créer la fonction update_updated_at_column si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table des sauvegardes de recherche
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100),
  search_query TEXT NOT NULL,
  filters JSONB, -- Filtres de recherche sauvegardés
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_updated_at ON saved_searches(updated_at DESC);

-- Activer Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Supprimer la politique si elle existe déjà (pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON saved_searches;

-- Politique RLS : les utilisateurs peuvent gérer leurs propres recherches sauvegardées
CREATE POLICY "Users can manage their own saved searches" ON saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at 
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table saved_searches créée avec succès!';
END $$;

