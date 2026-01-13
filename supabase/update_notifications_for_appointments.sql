-- ============================================
-- MISE À JOUR DES NOTIFICATIONS POUR LES RENDEZ-VOUS
-- ============================================
-- Ce script ajoute le support des notifications pour les rendez-vous
-- Exécutez ce script dans votre SQL Editor Supabase

-- Ajouter la colonne scheduled_at à la table notifications si elle n'existe pas
-- Cette colonne permet de programmer les notifications pour plus tard
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Ajouter un index pour les notifications programmées (pour les récupérer facilement)
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at) 
WHERE scheduled_at IS NOT NULL;

-- Ajouter un index pour le type 'appointment' si ce type est utilisé
CREATE INDEX IF NOT EXISTS idx_notifications_type_appointment ON notifications(type) 
WHERE type = 'appointment';

-- ============================================
-- FONCTION POUR CRÉER LES NOTIFICATIONS DE RENDEZ-VOUS
-- ============================================
-- Cette fonction crée automatiquement les notifications un jour avant et le jour J

CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  appointment_date DATE;
  one_day_before TIMESTAMP WITH TIME ZONE;
  appointment_day TIMESTAMP WITH TIME ZONE;
  sender_name VARCHAR(255);
  recipient_name VARCHAR(255);
BEGIN
  -- Ne créer des notifications que si le statut est 'pending' ou 'accepted'
  IF NEW.status IN ('pending', 'accepted') THEN
    -- Récupérer les noms des utilisateurs
    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO recipient_name
    FROM profiles
    WHERE id = NEW.recipient_id;

    -- Calculer les dates pour les notifications
    appointment_date := DATE(NEW.appointment_datetime);
    one_day_before := (appointment_date - INTERVAL '1 day') + TIME '09:00:00'; -- 9h du matin le jour précédent
    appointment_day := appointment_date + TIME '08:00:00'; -- 8h du matin le jour J

    -- Ne créer des notifications que si les dates sont dans le futur
    IF one_day_before > NOW() THEN
      -- Notification un jour avant pour le destinataire
      INSERT INTO notifications (user_id, type, title, content, related_id, scheduled_at)
      VALUES (
        NEW.recipient_id,
        'appointment',
        'Rappel : Rendez-vous demain avec ' || sender_name,
        'Vous avez un rendez-vous : "' || NEW.title || '" demain à ' || 
        TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
        NEW.id,
        one_day_before
      );

      -- Notification un jour avant pour l'expéditeur
      INSERT INTO notifications (user_id, type, title, content, related_id, scheduled_at)
      VALUES (
        NEW.sender_id,
        'appointment',
        'Rappel : Rendez-vous demain avec ' || recipient_name,
        'Vous avez un rendez-vous : "' || NEW.title || '" demain à ' || 
        TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
        NEW.id,
        one_day_before
      );
    END IF;

    -- Notification le jour J pour le destinataire
    IF appointment_day > NOW() THEN
      INSERT INTO notifications (user_id, type, title, content, related_id, scheduled_at)
      VALUES (
        NEW.recipient_id,
        'appointment',
        'Rendez-vous aujourd''hui avec ' || sender_name,
        'Vous avez un rendez-vous aujourd''hui : "' || NEW.title || '" à ' || 
        TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
        NEW.id,
        appointment_day
      );

      -- Notification le jour J pour l'expéditeur
      INSERT INTO notifications (user_id, type, title, content, related_id, scheduled_at)
      VALUES (
        NEW.sender_id,
        'appointment',
        'Rendez-vous aujourd''hui avec ' || recipient_name,
        'Vous avez un rendez-vous aujourd''hui : "' || NEW.title || '" à ' || 
        TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
        NEW.id,
        appointment_day
      );
    END IF;

    -- Notification immédiate pour informer le destinataire du nouveau rendez-vous
    IF NEW.status = 'pending' THEN
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (
        NEW.recipient_id,
        'appointment',
        sender_name || ' vous a proposé un rendez-vous',
        'Rendez-vous : "' || NEW.title || '" le ' || 
        TO_CHAR(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI'),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les notifications lors de la création d'un rendez-vous
CREATE TRIGGER trigger_create_appointment_notifications
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();

-- ============================================
-- FONCTION POUR METTRE À JOUR LES NOTIFICATIONS LORS D'UN CHANGEMENT
-- ============================================
-- Si le statut change (accepté, décliné, annulé), mettre à jour ou supprimer les notifications

CREATE OR REPLACE FUNCTION update_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le rendez-vous est annulé ou décliné, supprimer les notifications programmées
  IF NEW.status IN ('cancelled', 'declined') AND OLD.status IN ('pending', 'accepted') THEN
    DELETE FROM notifications 
    WHERE type = 'appointment' 
      AND related_id = NEW.id 
      AND scheduled_at IS NOT NULL
      AND scheduled_at > NOW();
  END IF;

  -- Si le rendez-vous est accepté, mettre à jour les notifications existantes
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- On peut ajouter une notification de confirmation ici si nécessaire
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les notifications lors d'un changement de statut
CREATE TRIGGER trigger_update_appointment_notifications
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_appointment_notifications();

-- ============================================
-- FONCTION POUR RÉCUPÉRER LES NOTIFICATIONS PROGRAMMÉES À ENVOYER
-- ============================================
-- Cette fonction peut être appelée par un cron job pour envoyer les notifications programmées

CREATE OR REPLACE FUNCTION get_scheduled_notifications_to_send()
RETURNS TABLE (
  notification_id UUID,
  user_id UUID,
  type VARCHAR(50),
  title VARCHAR(255),
  content TEXT,
  related_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.content,
    n.related_id
  FROM notifications n
  WHERE n.scheduled_at IS NOT NULL
    AND n.scheduled_at <= NOW()
    AND n.read = false
  ORDER BY n.scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON COLUMN notifications.scheduled_at IS 'Date et heure programmée pour l''envoi de la notification (pour les notifications futures)';
COMMENT ON FUNCTION create_appointment_notifications() IS 'Crée automatiquement les notifications un jour avant et le jour J pour un rendez-vous';
COMMENT ON FUNCTION update_appointment_notifications() IS 'Met à jour ou supprime les notifications lorsque le statut d''un rendez-vous change';
COMMENT ON FUNCTION get_scheduled_notifications_to_send() IS 'Récupère les notifications programmées qui doivent être envoyées maintenant';
