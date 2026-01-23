-- ============================================
-- TABLE MATCH_REQUESTS
-- ============================================
-- Table pour gérer les demandes de match (envoyées et reçues)

CREATE TABLE IF NOT EXISTS match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  related_service_name TEXT,
  related_service_description TEXT,
  related_service_payment_type VARCHAR(20),
  related_service_value TEXT,
  request_message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  CHECK (from_user_id != to_user_id)
);

-- Nettoyer les doublons avant d'ajouter la contrainte unique
-- Supprimer les doublons en gardant seulement la demande la plus récente pour chaque combinaison (from_user_id, related_post_id)
DO $$ 
BEGIN
  -- Supprimer les doublons en gardant l'ID le plus récent (basé sur created_at)
  DELETE FROM match_requests
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY from_user_id, related_post_id 
               ORDER BY created_at DESC, id DESC
             ) as rn
      FROM match_requests
      WHERE related_post_id IS NOT NULL
    ) t
    WHERE t.rn > 1
  );
  
  RAISE NOTICE 'Doublons supprimés de match_requests';
END $$;

-- Ajouter la contrainte unique si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'match_requests_from_user_post_unique'
  ) THEN
    ALTER TABLE match_requests 
    ADD CONSTRAINT match_requests_from_user_post_unique 
    UNIQUE(from_user_id, related_post_id);
    
    RAISE NOTICE 'Contrainte unique ajoutée à match_requests';
  ELSE
    RAISE NOTICE 'Contrainte unique existe déjà sur match_requests';
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_match_requests_from_user_id ON match_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_to_user_id ON match_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status);
CREATE INDEX IF NOT EXISTS idx_match_requests_related_post_id ON match_requests(related_post_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_conversation_id ON match_requests(conversation_id);

-- RLS (Row Level Security)
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent (pour permettre la ré-exécution du script)
DROP POLICY IF EXISTS "Users can view their own match requests" ON match_requests;
DROP POLICY IF EXISTS "Users can create match requests" ON match_requests;
DROP POLICY IF EXISTS "Users can update their own match requests" ON match_requests;

-- Politique : les utilisateurs peuvent voir leurs propres demandes (envoyées ou reçues)
CREATE POLICY "Users can view their own match requests"
  ON match_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Politique : les utilisateurs peuvent créer des demandes
CREATE POLICY "Users can create match requests"
  ON match_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs demandes
CREATE POLICY "Users can update their own match requests"
  ON match_requests FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_match_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_match_requests_updated_at ON match_requests;
CREATE TRIGGER trigger_update_match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_match_requests_updated_at();

-- Fonction pour mettre à jour accepted_at quand le statut passe à 'accepted'
CREATE OR REPLACE FUNCTION update_match_requests_accepted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour accepted_at
DROP TRIGGER IF EXISTS trigger_update_match_requests_accepted_at ON match_requests;
CREATE TRIGGER trigger_update_match_requests_accepted_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_match_requests_accepted_at();

