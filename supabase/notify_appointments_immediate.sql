-- Notifications immédiates lors de la création d'un rendez-vous
-- À exécuter dans Supabase SQL Editor

-- 1) S'assurer que la colonne metadata existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 2) Fonction de notification à l'insertion d'un rendez-vous
CREATE OR REPLACE FUNCTION public.notify_on_appointment()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Quelqu''un')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, content, related_id, metadata)
  VALUES
    (
      NEW.sender_id,
      'appointment',
      'Vous avez créé un rendez-vous',
      'Rendez-vous : "' || NEW.title || '" le ' || to_char(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI'),
      NEW.id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'appointment_id', NEW.id)
    ),
    (
      NEW.recipient_id,
      'appointment',
      sender_name || ' a créé un rendez-vous avec vous',
      'Rendez-vous : "' || NEW.title || '" le ' || to_char(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI'),
      NEW.id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'appointment_id', NEW.id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Trigger à l'INSERT sur appointments
DROP TRIGGER IF EXISTS trigger_notify_on_appointment ON public.appointments;
CREATE TRIGGER trigger_notify_on_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_appointment();
