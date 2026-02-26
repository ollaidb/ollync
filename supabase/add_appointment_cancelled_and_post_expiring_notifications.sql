-- ============================================
-- NOTIFICATIONS : RENDEZ-VOUS ANNULÉ + ANNONCES QUI VONT EXPIRER
-- ============================================
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- 1. NOTIFICATION QUAND UN RENDEZ-VOUS EST ANNULÉ
-- ============================================
-- Modifie update_appointment_notifications() pour créer une notification
-- destinée à l'autre participant quand un rendez-vous est annulé

CREATE OR REPLACE FUNCTION update_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
  canceller_id UUID;
  recipient_id UUID;
  canceller_name VARCHAR(255);
  appointment_title TEXT;
  appointment_datetime TEXT;
BEGIN
  -- Si le rendez-vous est annulé ou décliné, supprimer les notifications programmées
  IF NEW.status IN ('cancelled', 'declined') AND OLD.status IN ('pending', 'accepted') THEN
    DELETE FROM notifications 
    WHERE type IN ('appointment', 'appointment_reminder') 
      AND related_id = NEW.id 
      AND scheduled_at IS NOT NULL
      AND scheduled_at > NOW();
  END IF;

  -- Si le rendez-vous est annulé : notifier l'autre participant
  IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'accepted') AND auth.uid() IS NOT NULL THEN
    -- L'utilisateur qui a fait l'update est celui qui annule
    canceller_id := auth.uid();
    recipient_id := CASE 
      WHEN NEW.sender_id = canceller_id THEN NEW.recipient_id 
      ELSE NEW.sender_id 
    END;

    IF recipient_id IS NOT NULL AND recipient_id != canceller_id THEN
      SELECT COALESCE(full_name, username, 'Quelqu''un')
      INTO canceller_name
      FROM profiles
      WHERE id = canceller_id;

      appointment_title := COALESCE(NEW.title, 'Rendez-vous');
      appointment_datetime := TO_CHAR(NEW.appointment_datetime, 'DD/MM/YYYY à HH24:MI');

      INSERT INTO notifications (user_id, type, title, content, related_id, sender_id, metadata)
      VALUES (
        recipient_id,
        'appointment_cancelled',
        canceller_name || ' a annulé le rendez-vous "' || appointment_title || '"',
        'Le rendez-vous prévu le ' || appointment_datetime || ' a été annulé.',
        NEW.id,
        canceller_id,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'appointment_id', NEW.id,
          'appointment_title', appointment_title,
          'appointment_datetime', appointment_datetime
        )
      );
    END IF;
  END IF;

  -- Si le rendez-vous est accepté, mettre à jour les notifications existantes
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS trigger_update_appointment_notifications ON appointments;
CREATE TRIGGER trigger_update_appointment_notifications
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_appointment_notifications();


-- ============================================
-- 2. NOTIFICATION POUR LES ANNONCES QUI VONT EXPIRER
-- ============================================
-- Notifie le propriétaire d'une annonce 3 jours avant la date de besoin (needed_date)
-- À exécuter quotidiennement via pg_cron ou une Edge Function planifiée

CREATE OR REPLACE FUNCTION create_post_expiring_notifications()
RETURNS INTEGER AS $$
DECLARE
  post_record RECORD;
  notifications_created INTEGER := 0;
  days_before INTEGER := 3;  -- Notifier 3 jours avant needed_date
BEGIN
  FOR post_record IN
    SELECT 
      p.id,
      p.user_id,
      p.title,
      p.needed_date
    FROM posts p
    WHERE p.status = 'active'
      AND p.needed_date IS NOT NULL
      AND p.needed_date = (CURRENT_DATE + (days_before || ' days')::INTERVAL)::DATE
      -- Éviter les doublons : pas de notification post_expiring récente pour ce post
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_id = p.id
          AND n.type = 'post_expiring'
          AND n.user_id = p.user_id
          AND n.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO notifications (user_id, type, title, content, related_id, metadata)
    VALUES (
      post_record.user_id,
      'post_expiring',
      'Votre annonce "' || LEFT(post_record.title, 50) || '" expire dans ' || days_before || ' jours',
      'Date de fin prévue : ' || TO_CHAR(post_record.needed_date, 'DD/MM/YYYY') || '. Pensez à la mettre à jour si nécessaire.',
      post_record.id,
      jsonb_build_object(
        'post_id', post_record.id,
        'needed_date', post_record.needed_date,
        'days_remaining', days_before
      )
    );
    notifications_created := notifications_created + 1;
  END LOOP;

  RETURN notifications_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_post_expiring_notifications() IS 
  'Crée les notifications pour les annonces dont needed_date est dans 3 jours. À exécuter quotidiennement (ex: pg_cron à 9h).';


-- ============================================
-- 3. CRON : EXÉCUTER QUOTIDIENNEMENT (optionnel)
-- ============================================
-- Si pg_cron est activé sur votre projet Supabase :
-- SELECT cron.schedule(
--   'post-expiring-notifications',
--   '0 9 * * *',  -- Tous les jours à 9h UTC
--   $$SELECT create_post_expiring_notifications()$$
-- );
--
-- Pour activer pg_cron : Supabase Dashboard > Database > Extensions > pg_cron
-- Puis exécuter la commande SELECT cron.schedule(...) ci-dessus

