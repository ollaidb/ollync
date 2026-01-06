-- ============================================
-- TABLES POUR L'ALGORITHME DE RECOMMANDATION
-- ============================================
-- Ce fichier crée les tables nécessaires pour un système intelligent
-- de recommandation d'annonces basé sur:
-- - La localisation de l'utilisateur (si disponible)
-- - Les likes de l'utilisateur
-- - Les intérêts exprimés (swipe à droite)
-- - Les annonces les plus consultées
-- - D'autres critères personnalisables

-- 1. Table des règles de recommandation
-- Stocke les différentes règles et leurs pondérations
CREATE TABLE IF NOT EXISTS recommendation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Pondérations des différents critères (0 à 100)
  location_weight DECIMAL(5, 2) DEFAULT 30.00, -- Poids de la localisation
  category_weight DECIMAL(5, 2) DEFAULT 25.00, -- Poids des catégories likées
  interest_weight DECIMAL(5, 2) DEFAULT 20.00, -- Poids des intérêts exprimés
  views_weight DECIMAL(5, 2) DEFAULT 15.00, -- Poids des vues (engagement)
  recency_weight DECIMAL(5, 2) DEFAULT 10.00, -- Poids de la récence (nouveauté)
  
  -- Paramètres de localisation
  require_user_location BOOLEAN DEFAULT false, -- Si true, nécessite que l'utilisateur ait une adresse
  location_radius_km INTEGER DEFAULT 50, -- Rayon de recherche par défaut (km)
  allow_remote BOOLEAN DEFAULT true, -- Si true, inclut les annonces sans localisation spécifique
  
  -- Paramètres d'engagement
  min_views_count INTEGER DEFAULT 0, -- Nombre minimum de vues pour considérer l'engagement
  consider_likes BOOLEAN DEFAULT true, -- Prendre en compte les likes
  consider_interests BOOLEAN DEFAULT true, -- Prendre en compte les intérêts (swipe)
  consider_favorites BOOLEAN DEFAULT true, -- Prendre en compte les favoris
  
  -- Paramètres de filtrage
  exclude_user_own_posts BOOLEAN DEFAULT true, -- Exclure les propres posts de l'utilisateur
  exclude_seen_posts BOOLEAN DEFAULT false, -- Exclure les posts déjà vus
  exclude_swiped_posts BOOLEAN DEFAULT true, -- Exclure les posts déjà swipés
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des scores de recommandation (cache)
-- Stocke les scores calculés pour chaque combinaison utilisateur-post
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES recommendation_rules(id) ON DELETE CASCADE,
  
  -- Score global (0 à 100)
  total_score DECIMAL(5, 2) NOT NULL,
  
  -- Scores détaillés par critère (pour debug/transparence)
  location_score DECIMAL(5, 2) DEFAULT 0,
  category_score DECIMAL(5, 2) DEFAULT 0,
  interest_score DECIMAL(5, 2) DEFAULT 0,
  views_score DECIMAL(5, 2) DEFAULT 0,
  recency_score DECIMAL(5, 2) DEFAULT 0,
  
  -- Métadonnées
  distance_km DECIMAL(8, 2), -- Distance entre utilisateur et post (si calculable)
  reason TEXT, -- Explication du score (ex: "Proche géographiquement + catégorie appréciée")
  
  -- Dates
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Pour invalider le cache après X temps
  
  UNIQUE(user_id, post_id, rule_id)
);

-- 3. Table de l'historique des recommandations affichées
-- Pour apprendre et améliorer l'algorithme
CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES recommendation_rules(id) ON DELETE SET NULL,
  
  -- Contexte de la recommandation
  position INTEGER, -- Position dans le feed (1 = premier, 2 = deuxième, etc.)
  was_shown BOOLEAN DEFAULT true, -- Si le post a été réellement affiché
  was_clicked BOOLEAN DEFAULT false, -- Si l'utilisateur a cliqué/vu
  was_liked BOOLEAN DEFAULT false, -- Si l'utilisateur a liké
  was_interested BOOLEAN DEFAULT false, -- Si l'utilisateur a swipé à droite
  was_ignored BOOLEAN DEFAULT false, -- Si l'utilisateur a swipé à gauche
  
  -- Score au moment de l'affichage
  score_at_display DECIMAL(5, 2),
  
  -- Dates
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interacted_at TIMESTAMP WITH TIME ZONE
);

-- 4. Table des préférences utilisateur pour l'algorithme
-- Permet à l'utilisateur de personnaliser ses recommandations
CREATE TABLE IF NOT EXISTS user_algorithm_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Préférences de localisation
  use_location BOOLEAN DEFAULT true, -- Utiliser la localisation si disponible
  preferred_location_radius_km INTEGER DEFAULT 50,
  
  -- Préférences de catégories (priorité)
  preferred_categories JSONB DEFAULT '[]'::jsonb, -- Array d'IDs de catégories préférées
  preferred_sub_categories JSONB DEFAULT '[]'::jsonb, -- Array d'IDs de sous-catégories préférées
  
  -- Priorités personnalisées (override des règles globales)
  override_location_weight DECIMAL(5, 2), -- NULL = utiliser la règle globale
  override_category_weight DECIMAL(5, 2),
  override_interest_weight DECIMAL(5, 2),
  
  -- Filtres
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  only_urgent BOOLEAN DEFAULT false,
  only_with_delivery BOOLEAN DEFAULT false,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES POUR PERFORMANCE
-- ============================================

-- Indexes pour user_recommendations
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_post_id ON user_recommendations(post_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_rule_id ON user_recommendations(rule_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_total_score ON user_recommendations(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_score ON user_recommendations(user_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_expires_at ON user_recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- Indexes pour recommendation_history
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_post_id ON recommendation_history(post_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_shown_at ON recommendation_history(shown_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_shown ON recommendation_history(user_id, shown_at DESC);

-- Indexes pour user_algorithm_preferences
CREATE INDEX IF NOT EXISTS idx_user_algorithm_preferences_user_id ON user_algorithm_preferences(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS pour recommendation_rules (lecture publique, écriture admin)
ALTER TABLE recommendation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active rules" ON recommendation_rules;
CREATE POLICY "Anyone can view active rules"
  ON recommendation_rules FOR SELECT
  USING (is_active = true);

-- RLS pour user_recommendations (utilisateurs voient leurs propres recommandations)
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recommendations" ON user_recommendations;
CREATE POLICY "Users can view their own recommendations"
  ON user_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS pour recommendation_history (utilisateurs voient leur propre historique)
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recommendation history" ON recommendation_history;
CREATE POLICY "Users can view their own recommendation history"
  ON recommendation_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recommendation history" ON recommendation_history;
CREATE POLICY "Users can insert their own recommendation history"
  ON recommendation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recommendation history" ON recommendation_history;
CREATE POLICY "Users can update their own recommendation history"
  ON recommendation_history FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS pour user_algorithm_preferences (utilisateurs gèrent leurs propres préférences)
ALTER TABLE user_algorithm_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own algorithm preferences" ON user_algorithm_preferences;
CREATE POLICY "Users can manage their own algorithm preferences"
  ON user_algorithm_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Règle par défaut pour l'algorithme
INSERT INTO recommendation_rules (
  name,
  description,
  location_weight,
  category_weight,
  interest_weight,
  views_weight,
  recency_weight,
  require_user_location,
  location_radius_km,
  allow_remote
) VALUES (
  'default',
  'Règle par défaut : Recommandations équilibrées basées sur localisation, préférences et engagement',
  30.00, -- 30% localisation
  25.00, -- 25% catégories likées
  20.00, -- 20% intérêts exprimés
  15.00, -- 15% vues (engagement)
  10.00, -- 10% récence
  false, -- Ne nécessite pas obligatoirement une adresse utilisateur
  50, -- Rayon de 50km par défaut
  true -- Autorise les annonces sans localisation spécifique
) ON CONFLICT (name) DO NOTHING;

-- Règle pour utilisateurs avec adresse (plus de poids sur la localisation)
INSERT INTO recommendation_rules (
  name,
  description,
  location_weight,
  category_weight,
  interest_weight,
  views_weight,
  recency_weight,
  require_user_location,
  location_radius_km,
  allow_remote
) VALUES (
  'with_location',
  'Règle pour utilisateurs avec adresse : Priorité à la proximité géographique',
  45.00, -- 45% localisation (plus élevé)
  20.00, -- 20% catégories
  15.00, -- 15% intérêts
  12.00, -- 12% vues
  8.00, -- 8% récence
  true, -- Nécessite une adresse utilisateur
  50,
  false -- Moins d'annonces sans localisation
) ON CONFLICT (name) DO NOTHING;

-- Règle pour utilisateurs sans adresse (plus de poids sur préférences)
INSERT INTO recommendation_rules (
  name,
  description,
  location_weight,
  category_weight,
  interest_weight,
  views_weight,
  recency_weight,
  require_user_location,
  location_radius_km,
  allow_remote
) VALUES (
  'without_location',
  'Règle pour utilisateurs sans adresse : Basé sur préférences et engagement',
  0.00, -- 0% localisation
  35.00, -- 35% catégories (plus élevé)
  30.00, -- 30% intérêts (plus élevé)
  20.00, -- 20% vues
  15.00, -- 15% récence
  false,
  0,
  true -- Toutes les annonces possibles
) ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE recommendation_rules IS 'Règles et paramètres de l''algorithme de recommandation';
COMMENT ON TABLE user_recommendations IS 'Scores de recommandation calculés (cache) pour chaque utilisateur-post';
COMMENT ON TABLE recommendation_history IS 'Historique des recommandations affichées pour améliorer l''algorithme';
COMMENT ON TABLE user_algorithm_preferences IS 'Préférences personnalisées de l''utilisateur pour les recommandations';

COMMENT ON COLUMN recommendation_rules.location_weight IS 'Pondération de la localisation (0-100)';
COMMENT ON COLUMN recommendation_rules.category_weight IS 'Pondération des catégories likées (0-100)';
COMMENT ON COLUMN recommendation_rules.interest_weight IS 'Pondération des intérêts exprimés (0-100)';
COMMENT ON COLUMN recommendation_rules.views_weight IS 'Pondération des vues/engagement (0-100)';
COMMENT ON COLUMN recommendation_rules.recency_weight IS 'Pondération de la récence (0-100)';

