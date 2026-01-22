-- ============================================
-- DATE DE NAISSANCE + NOTIFICATIONS/EMAILS
-- ============================================
-- 1) Ajoute la date de naissance dans profiles
-- 2) Met en place une file d'emails sortants
-- 3) Crée des notifications de bienvenue + anniversaire
-- 4) Fournit des fonctions pour les fêtes générales
--
-- Exécutez ce script dans le SQL Editor Supabase.

-- --------------------------------------------
-- 1. Colonne date de naissance
-- --------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- --------------------------------------------
-- 2. File d'emails sortants (à consommer via un worker/Edge Function)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_queue_status_idx
  ON public.email_queue (status, scheduled_for);

-- --------------------------------------------
-- 3. Helpers notification + email
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_content TEXT,
  p_related_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, related_id)
  VALUES (p_user_id, p_type, p_title, p_content, p_related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.queue_email(
  p_user_id UUID,
  p_template VARCHAR(100),
  p_subject VARCHAR(255),
  p_payload JSONB,
  p_scheduled_for TIMESTAMPTZ DEFAULT now()
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.email_queue (user_id, template, subject, payload, scheduled_for)
  VALUES (p_user_id, p_template, p_subject, COALESCE(p_payload, '{}'::jsonb), p_scheduled_for);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- 4. Bienvenue : notification + email à l'inscription
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_welcome_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification in-app
  PERFORM public.create_notification(
    NEW.id,
    'welcome',
    'Bienvenue sur Ollync',
    'Merci pour votre inscription. Commencez par compléter votre profil.',
    NULL
  );

  -- Email à envoyer via un worker
  PERFORM public.queue_email(
    NEW.id,
    'welcome',
    'Bienvenue sur Ollync',
    jsonb_build_object('full_name', COALESCE(NEW.full_name, NEW.username)),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_welcome_user ON public.profiles;
CREATE TRIGGER trigger_notify_welcome_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome_user();

-- --------------------------------------------
-- 4.bis. Likes : email si quelqu'un aime une annonce
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_email_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  SELECT
    p.user_id,
    pr.full_name,
    p.title
  INTO
    post_owner_id,
    liker_name,
    post_title
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    IF liker_name IS NULL OR liker_name = '' THEN
      SELECT username INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
      IF liker_name IS NULL OR liker_name = '' THEN
        liker_name := 'Quelqu''un';
      END IF;
    END IF;

    PERFORM public.queue_email(
      post_owner_id,
      'like',
      liker_name || ' a aimé votre annonce',
      jsonb_build_object(
        'liker_name', liker_name,
        'post_title', COALESCE(post_title, 'Votre annonce')
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_queue_email_on_like ON public.likes;
CREATE TRIGGER trigger_queue_email_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_email_on_like();

-- --------------------------------------------
-- 5. Anniversaires : notification + email
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.send_birthday_notifications(p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id, full_name, username
    FROM public.profiles
    WHERE birth_date IS NOT NULL
      AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM p_target_date)
      AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM p_target_date)
  LOOP
    -- Éviter les doublons de la journée
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications
      WHERE user_id = profile_record.id
        AND type = 'birthday'
        AND created_at::date = p_target_date
    ) THEN
      PERFORM public.create_notification(
        profile_record.id,
        'birthday',
        'Joyeux anniversaire',
        'Toute l’équipe vous souhaite un très bel anniversaire.',
        NULL
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.email_queue
      WHERE user_id = profile_record.id
        AND template = 'birthday'
        AND scheduled_for::date = p_target_date
    ) THEN
      PERFORM public.queue_email(
        profile_record.id,
        'birthday',
        'Joyeux anniversaire',
        jsonb_build_object('full_name', COALESCE(profile_record.full_name, profile_record.username)),
        p_target_date::timestamptz
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- 6. Fêtes générales : notification + email
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.send_holiday_notifications(
  p_title VARCHAR(255),
  p_content TEXT,
  p_template VARCHAR(100) DEFAULT 'holiday',
  p_send_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id, full_name, username
    FROM public.profiles
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications
      WHERE user_id = profile_record.id
        AND type = p_template
        AND created_at::date = p_send_date
    ) THEN
      PERFORM public.create_notification(
        profile_record.id,
        p_template,
        p_title,
        p_content,
        NULL
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.email_queue
      WHERE user_id = profile_record.id
        AND template = p_template
        AND scheduled_for::date = p_send_date
    ) THEN
      PERFORM public.queue_email(
        profile_record.id,
        p_template,
        p_title,
        jsonb_build_object(
          'full_name', COALESCE(profile_record.full_name, profile_record.username),
          'content', p_content
        ),
        p_send_date::timestamptz
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- NOTES
-- --------------------------------------------
-- - Pour automatiser les envois, planifiez :
--   SELECT public.send_birthday_notifications();
-- - Pour une fête générale :
--   SELECT public.send_holiday_notifications('Bonne année', 'Meilleurs vœux pour cette nouvelle année !', 'new_year');
-- - Un worker/Edge Function doit lire public.email_queue et envoyer les emails.
