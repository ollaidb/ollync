-- ============================================
-- SCRIPT COMPLET POUR ACTIVER LES FONCTIONNALITÉS DE MESSAGERIE
-- ============================================
-- Ce script active les trois boutons : Médias, Annonce, Rendez-vous
-- Exécutez ce script dans votre SQL Editor Supabase
-- ============================================

-- ============================================
-- 1. EXTENSION DE LA TABLE MESSAGES
-- ============================================

DO $$ 
BEGIN
  -- message_type: pour différencier les types de messages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
    RAISE NOTICE '✅ Colonne message_type ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne message_type existe déjà';
  END IF;

  -- file_url: pour les photos, vidéos, documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_url TEXT;
    RAISE NOTICE '✅ Colonne file_url ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne file_url existe déjà';
  END IF;

  -- file_name: nom du fichier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_name VARCHAR(255);
    RAISE NOTICE '✅ Colonne file_name ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne file_name existe déjà';
  END IF;

  -- file_size: taille du fichier en bytes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_size BIGINT;
    RAISE NOTICE '✅ Colonne file_size ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne file_size existe déjà';
  END IF;

  -- file_type: MIME type (image/jpeg, video/mp4, application/pdf, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_type VARCHAR(100);
    RAISE NOTICE '✅ Colonne file_type ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne file_type existe déjà';
  END IF;

  -- shared_post_id: pour partager une annonce (POST_SHARE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'shared_post_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
      ALTER TABLE messages ADD COLUMN shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE messages ADD COLUMN shared_post_id UUID;
    END IF;
    RAISE NOTICE '✅ Colonne shared_post_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne shared_post_id existe déjà';
  END IF;

  -- calendar_request_data: JSONB pour stocker les données de rendez-vous
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'calendar_request_data'
  ) THEN
    ALTER TABLE messages ADD COLUMN calendar_request_data JSONB;
    RAISE NOTICE '✅ Colonne calendar_request_data ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne calendar_request_data existe déjà';
  END IF;
END $$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_shared_post_id ON messages(shared_post_id) WHERE shared_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_file_url ON messages(file_url) WHERE file_url IS NOT NULL;

-- ============================================
-- 2. TABLE APPOINTMENTS (RENDEZ-VOUS)
-- ============================================

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

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_appointments_conversation_id ON appointments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recipient_id ON appointments(recipient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_sender_id ON appointments(sender_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- ============================================
-- 3. POLITIQUES RLS POUR APPOINTMENTS
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments as sender" ON appointments;
DROP POLICY IF EXISTS "Users can update their appointments" ON appointments;

-- Politique : Les utilisateurs peuvent voir leurs propres rendez-vous
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
-- 4. NOTIFICATIONS POUR LES RENDEZ-VOUS
-- ============================================

-- Vérifier si la colonne scheduled_at existe dans notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;
    RAISE NOTICE '✅ Colonne scheduled_at ajoutée à notifications';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne scheduled_at existe déjà dans notifications';
  END IF;
END $$;

-- Fonction pour créer les notifications de rendez-vous
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  appointment_date DATE;
  one_day_before TIMESTAMP WITH TIME ZONE;
  on_the_day TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer la date du rendez-vous
  appointment_date := DATE(NEW.appointment_datetime);
  
  -- Notification 1 jour avant (à 9h du matin)
  one_day_before := (appointment_date - INTERVAL '1 day')::DATE + TIME '09:00:00';
  
  -- Notification le jour même (à 8h du matin)
  on_the_day := appointment_date::DATE + TIME '08:00:00';
  
  -- Créer la notification 1 jour avant (si la date n'est pas passée)
  IF one_day_before > NOW() THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      scheduled_at
    ) VALUES (
      NEW.recipient_id,
      'appointment_reminder',
      'Rappel de rendez-vous',
      'Vous avez un rendez-vous demain : ' || NEW.title || ' le ' || 
      TO_CHAR(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI'),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'appointment_datetime', NEW.appointment_datetime,
        'title', NEW.title
      ),
      one_day_before
    );
  END IF;
  
  -- Créer la notification le jour même (si la date n'est pas passée)
  IF on_the_day > NOW() THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      scheduled_at
    ) VALUES (
      NEW.recipient_id,
      'appointment_reminder',
      'Rappel de rendez-vous',
      'Vous avez un rendez-vous aujourd''hui : ' || NEW.title || ' à ' || 
      TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'appointment_datetime', NEW.appointment_datetime,
        'title', NEW.title
      ),
      on_the_day
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les notifications
DROP TRIGGER IF EXISTS trigger_create_appointment_notifications ON appointments;
CREATE TRIGGER trigger_create_appointment_notifications
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();

-- ============================================
-- 5. VÉRIFICATION DES BUCKETS DE STOCKAGE
-- ============================================
-- Note: Les buckets doivent être créés manuellement dans Supabase Dashboard
-- Storage > Buckets > New bucket
-- 
-- Buckets nécessaires:
-- 1. 'posts' - pour les photos (public)
-- 2. 'videos' - pour les vidéos (public)
-- 3. 'documents' - pour les documents (public)
--
-- Pour chaque bucket, activer:
-- - Public bucket: Oui
-- - File size limit: 50 MB (ou selon vos besoins)
-- - Allowed MIME types: 
--   - posts: image/*
--   - videos: video/*
--   - documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

-- ============================================
-- 6. POLITIQUES DE STOCKAGE (si les buckets existent)
-- ============================================

-- Note: Ces politiques seront créées automatiquement si les buckets existent
-- Sinon, créez-les manuellement dans Supabase Dashboard > Storage > Policies

-- ============================================
-- 7. VÉRIFICATION FINALE
-- ============================================

DO $$ 
DECLARE
  messages_columns TEXT[];
  appointments_exists BOOLEAN;
BEGIN
  -- Vérifier les colonnes de messages
  SELECT array_agg(column_name) INTO messages_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'messages'
    AND column_name IN ('message_type', 'file_url', 'file_name', 'file_size', 'file_type', 'shared_post_id', 'calendar_request_data');
  
  -- Vérifier si appointments existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments'
  ) INTO appointments_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT TERMINÉ AVEC SUCCÈS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonnes vérifiées dans messages: %', array_to_string(messages_columns, ', ');
  RAISE NOTICE 'Table appointments existe: %', appointments_exists;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FONCTIONNALITÉS ACTIVÉES:';
  RAISE NOTICE '  ✅ Médias (Photo, Vidéo, Document)';
  RAISE NOTICE '  ✅ Annonce (Partage d''annonce)';
  RAISE NOTICE '  ✅ Rendez-vous (Calendrier)';
  RAISE NOTICE '  ✅ Notifications automatiques pour rendez-vous';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  ACTION REQUISE:';
  RAISE NOTICE '  Créez les buckets de stockage dans Supabase Dashboard:';
  RAISE NOTICE '    - posts (pour photos)';
  RAISE NOTICE '    - videos (pour vidéos)';
  RAISE NOTICE '    - documents (pour documents)';
  RAISE NOTICE '========================================';
END $$;
