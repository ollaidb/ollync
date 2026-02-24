-- ============================================
-- CORRECTION : trigger notifications rendez-vous
-- ============================================
-- Le trigger create_appointment_notifications utilisait les colonnes "message" et "data"
-- qui n'existent pas sur la table notifications (elle utilise "content" et "metadata").
-- Ce script corrige la fonction pour que la création et la modification de rendez-vous
-- ne provoquent plus l'erreur 42703 (column "message" does not exist).
-- À exécuter dans le SQL Editor Supabase.
-- ============================================

-- S'assurer que les colonnes existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Remplacer la fonction pour utiliser content et metadata au lieu de message et data
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  appointment_date DATE;
  one_day_before TIMESTAMP WITH TIME ZONE;
  on_the_day TIMESTAMP WITH TIME ZONE;
BEGIN
  appointment_date := DATE(NEW.appointment_datetime);
  one_day_before := (appointment_date - INTERVAL '1 day')::DATE + TIME '09:00:00';
  on_the_day := appointment_date::DATE + TIME '08:00:00';

  IF one_day_before > NOW() THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      related_id,
      metadata,
      scheduled_at
    ) VALUES (
      NEW.recipient_id,
      'appointment_reminder',
      'Rappel de rendez-vous',
      'Vous avez un rendez-vous demain : ' || NEW.title || ' le ' ||
      TO_CHAR(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI'),
      NEW.id,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'appointment_datetime', NEW.appointment_datetime,
        'title', NEW.title
      ),
      one_day_before
    );
  END IF;

  IF on_the_day > NOW() THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      related_id,
      metadata,
      scheduled_at
    ) VALUES (
      NEW.recipient_id,
      'appointment_reminder',
      'Rappel de rendez-vous',
      'Vous avez un rendez-vous aujourd''hui : ' || NEW.title || ' à ' ||
      TO_CHAR(NEW.appointment_datetime, 'HH24:MI'),
      NEW.id,
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

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_create_appointment_notifications ON appointments;
CREATE TRIGGER trigger_create_appointment_notifications
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();
