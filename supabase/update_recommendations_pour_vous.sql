-- ============================================
-- MISE À JOUR POUR LA SECTION "POUR VOUS"
-- ============================================
-- Recommandations basées sur :
-- - Likes (posts likés)
-- - Applications / demandes (annonces auxquelles l'utilisateur a postulé)
-- - Publications (catégories des annonces publiées par l'utilisateur)
-- - Recherches (search_history avec filtres category_id)
--
-- Exécuter ce script pour activer la section "Pour vous" avec toutes les sources de données.

-- Extension pour générer des UUIDs (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE search_history (pour recommandations basées sur les recherches)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_query TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  clicked_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT search_history_user_id_check CHECK (user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_searched ON search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_filters ON search_history USING GIN(filters);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
CREATE POLICY "Users can insert their own search history"
  ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;
CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE search_history IS 'Historique des recherches pour recommandations "Pour vous"';

-- 2. Index pour applications (applicant_id) - recommandations basées sur les demandes
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);

-- 3. Index pour posts (user_id, status) - recommandations basées sur les publications
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status)
  WHERE status IN ('active', 'archived', 'completed');

-- 4. Index pour likes (user_id) - déjà souvent présent, on s'assure
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Mise à jour "Pour vous" appliquée : search_history, index applications, posts, likes.';
END $$;
