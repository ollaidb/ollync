-- ============================================
-- TABLE POUR L'HISTORIQUE DES RECHERCHES
-- ============================================
-- Cette table track toutes les recherches effectuées par les utilisateurs
-- (pas seulement les recherches sauvegardées)
-- Permet de faire des recommandations basées sur les recherches

-- Extension pour générer des UUIDs (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table de l'historique des recherches
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Requête de recherche
  search_query TEXT, -- Texte recherché (peut être NULL si recherche par filtres uniquement)
  
  -- Filtres de recherche (JSONB pour flexibilité)
  filters JSONB DEFAULT '{}'::jsonb, -- {category_id, sub_category_id, location, price_min, price_max, etc.}
  
  -- Résultats et interactions
  results_count INTEGER DEFAULT 0, -- Nombre de résultats trouvés
  clicked_post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Post cliqué dans les résultats (si applicable)
  
  -- Métadonnées
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index pour recherche rapide
  CONSTRAINT search_history_user_id_check CHECK (user_id IS NOT NULL)
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_searched ON search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_filters ON search_history USING GIN(filters);
CREATE INDEX IF NOT EXISTS idx_search_history_clicked_post ON search_history(clicked_post_id) WHERE clicked_post_id IS NOT NULL;

-- Activer Row Level Security
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;

-- Politique : les utilisateurs peuvent voir leur propre historique de recherche
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent insérer leur propre historique de recherche
CREATE POLICY "Users can insert their own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent supprimer leur propre historique de recherche
CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE search_history IS 'Historique de toutes les recherches effectuées par les utilisateurs (pour recommandations)';
COMMENT ON COLUMN search_history.search_query IS 'Texte recherché (peut être NULL si recherche par filtres uniquement)';
COMMENT ON COLUMN search_history.filters IS 'Filtres de recherche au format JSONB : {category_id, sub_category_id, location, price_min, price_max, etc.}';
COMMENT ON COLUMN search_history.results_count IS 'Nombre de résultats trouvés pour cette recherche';
COMMENT ON COLUMN search_history.clicked_post_id IS 'ID du post cliqué dans les résultats (si applicable)';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table search_history créée avec succès!';
END $$;
