-- ============================================
-- TABLE POUR STOCKER LES SIGNALEMENTS
-- ============================================
-- Ce script crée la table pour stocker les signalements de profils et d'annonces
-- Exécutez ce script dans votre SQL Editor Supabase

-- Créer la table reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'profile' ou 'post'
  report_reason VARCHAR(100) NOT NULL, -- 'suspect', 'fraudeur', 'fondant', 'sexuel', 'inappropriate', etc.
  report_category VARCHAR(50), -- 'behavior' pour comportement, 'post' pour annonce
  description TEXT, -- Description supplémentaire optionnelle
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_post ON reports(reported_post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- Activer RLS (Row Level Security)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent créer leurs propres signalements
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Politique : Les utilisateurs peuvent voir leurs propres signalements
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Politique : Les admins peuvent voir tous les signalements (nécessite un rôle admin)
-- À adapter selon votre système d'administration

-- Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_reports_updated_at_trigger ON reports;
CREATE TRIGGER update_reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ TABLE REPORTS CRÉÉE AVEC SUCCÈS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'La table reports permet de stocker :';
  RAISE NOTICE '  - Signalements de profils (report_type = ''profile'')';
  RAISE NOTICE '  - Signalements d''annonces (report_type = ''post'')';
  RAISE NOTICE '';
  RAISE NOTICE 'Raisons possibles :';
  RAISE NOTICE '  - suspect : Comportement suspect';
  RAISE NOTICE '  - fraudeur : Fraude ou escroquerie';
  RAISE NOTICE '  - fondant : Contenu inapproprié/fondant';
  RAISE NOTICE '  - sexuel : Contenu à caractère sexuel';
  RAISE NOTICE '  - inappropriate : Contenu inapproprié';
  RAISE NOTICE '  - spam : Spam';
  RAISE NOTICE '  - autre : Autre raison';
  RAISE NOTICE '';
END $$;

