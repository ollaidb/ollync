-- ============================================
-- TABLE DES RECOMMANDATIONS UTILISATEUR (VERSION SIMPLIFIÉE)
-- ============================================
-- Cette table remplace les 4 tables précédentes (recommendation_rules, 
-- user_recommendations, recommendation_history, user_algorithm_preferences)
-- Une seule table simple pour gérer toutes les recommandations
-- ============================================

-- Extension pour générer des UUIDs (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE USER_RECOMMENDATIONS (NOUVELLE VERSION)
-- ============================================

CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Score de recommandation (0-100)
  score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  CHECK (score >= 0 AND score <= 100),
  
  -- Raison de la recommandation (pour transparence)
  reason TEXT, -- Ex: "Basé sur vos likes", "Proche géographiquement", "Dans vos catégories préférées"
  
  -- Type de recommandation (pour catégoriser)
  recommendation_type VARCHAR(50) DEFAULT 'algorithm', -- 'algorithm', 'trending', 'similar', 'location'
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir qu'une seule recommandation par post
  UNIQUE(user_id, post_id)
);

-- ============================================
-- INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_post_id ON user_recommendations(post_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_score ON user_recommendations(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_type ON user_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_created_at ON user_recommendations(created_at DESC);

-- ============================================
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_user_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_recommendations_updated_at ON user_recommendations;
CREATE TRIGGER trigger_update_user_recommendations_updated_at
  BEFORE UPDATE ON user_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_recommendations_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own recommendations" ON user_recommendations;
DROP POLICY IF EXISTS "System can insert recommendations" ON user_recommendations;
DROP POLICY IF EXISTS "System can update recommendations" ON user_recommendations;
DROP POLICY IF EXISTS "System can delete recommendations" ON user_recommendations;

-- Politique : les utilisateurs peuvent voir leurs propres recommandations
CREATE POLICY "Users can view their own recommendations"
  ON user_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : le système peut insérer des recommandations (service role)
-- Note: En production, vous pourriez vouloir utiliser service_role_key
-- Pour l'instant, on permet aux utilisateurs de créer leurs propres recommandations (pour les tests)
CREATE POLICY "System can insert recommendations"
  ON user_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : le système peut mettre à jour les recommandations
CREATE POLICY "System can update recommendations"
  ON user_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : le système peut supprimer les recommandations
CREATE POLICY "System can delete recommendations"
  ON user_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE user_recommendations IS 'Recommandations de posts pour les utilisateurs. Table unique et simplifiée qui remplace les 4 tables précédentes (recommendation_rules, user_recommendations, recommendation_history, user_algorithm_preferences).';
COMMENT ON COLUMN user_recommendations.score IS 'Score de recommandation entre 0 et 100. Plus le score est élevé, plus la recommandation est pertinente.';
COMMENT ON COLUMN user_recommendations.reason IS 'Raison de la recommandation pour transparence (ex: "Basé sur vos likes", "Proche géographiquement").';
COMMENT ON COLUMN user_recommendations.recommendation_type IS 'Type de recommandation: algorithm (basé sur l''algorithme), trending (tendances), similar (similaire), location (proximité géographique).';

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Table user_recommendations (nouvelle version simplifiée) créée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE 'Cette table remplace les 4 tables précédentes:';
  RAISE NOTICE '  - recommendation_rules';
  RAISE NOTICE '  - user_recommendations (ancienne version)';
  RAISE NOTICE '  - recommendation_history';
  RAISE NOTICE '  - user_algorithm_preferences';
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisation:';
  RAISE NOTICE '  - Insérer: INSERT INTO user_recommendations (user_id, post_id, score, reason, recommendation_type) VALUES (...)';
  RAISE NOTICE '  - Récupérer: SELECT * FROM user_recommendations WHERE user_id = $1 ORDER BY score DESC';
  RAISE NOTICE '  - Mettre à jour: UPDATE user_recommendations SET score = $1, reason = $2 WHERE user_id = $3 AND post_id = $4';
END $$;
