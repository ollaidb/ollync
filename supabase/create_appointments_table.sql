-- ============================================
-- TABLE APPOINTMENTS (RENDEZ-VOUS)
-- ============================================
-- Cette table stocke les rendez-vous créés dans les conversations
-- Exécutez ce script dans votre SQL Editor Supabase

-- Créer la table appointments si elle n'existe pas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_appointment_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

-- Créer un index pour les recherches par conversation
CREATE INDEX IF NOT EXISTS idx_appointments_conversation_id ON appointments(conversation_id);

-- Créer un index pour les recherches par destinataire
CREATE INDEX IF NOT EXISTS idx_appointments_recipient_id ON appointments(recipient_id);

-- Créer un index pour les recherches par date (pour les notifications)
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);

-- Créer un index pour les recherches par statut
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur la table appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres rendez-vous (en tant que sender ou recipient)
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

-- Politique : Les utilisateurs peuvent créer des rendez-vous s'ils sont le sender
CREATE POLICY "Users can create appointments as sender"
  ON appointments
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Politique : Les utilisateurs peuvent mettre à jour les rendez-vous s'ils sont le sender ou le recipient
CREATE POLICY "Users can update their appointments"
  ON appointments
  FOR UPDATE
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  )
  WITH CHECK (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE appointments IS 'Table pour stocker les rendez-vous créés dans les conversations';
COMMENT ON COLUMN appointments.message_id IS 'ID du message qui contient la demande de rendez-vous';
COMMENT ON COLUMN appointments.conversation_id IS 'ID de la conversation où le rendez-vous a été créé';
COMMENT ON COLUMN appointments.sender_id IS 'ID de l''utilisateur qui a créé le rendez-vous';
COMMENT ON COLUMN appointments.recipient_id IS 'ID de l''utilisateur qui reçoit l''invitation au rendez-vous';
COMMENT ON COLUMN appointments.title IS 'Titre du rendez-vous';
COMMENT ON COLUMN appointments.appointment_datetime IS 'Date et heure du rendez-vous';
COMMENT ON COLUMN appointments.status IS 'Statut du rendez-vous : pending, accepted, declined, cancelled';
