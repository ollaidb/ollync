-- Empêche l'envoi de messages liés à une annonce (shared_post_id)
-- tant qu'aucune demande n'est acceptée entre les deux utilisateurs.
--
-- ⚠️ Ce guard ne bloque PAS la messagerie classique (messages sans shared_post_id).
-- Il ne vise que les premiers messages envoyés depuis une annonce.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_post_message_requires_accepted_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv record;
  has_accepted boolean;
BEGIN
  -- Si pas de post lié, on laisse passer (messagerie normale)
  IF NEW.shared_post_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer les participants de la conversation
  SELECT c.user1_id, c.user2_id, c.is_group
  INTO conv
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF conv IS NULL THEN
    RAISE EXCEPTION 'Conversation introuvable';
  END IF;

  -- Pas de restriction pour les groupes
  IF COALESCE(conv.is_group, false) = true THEN
    RETURN NEW;
  END IF;

  -- Exige une demande acceptée entre les 2 utilisateurs pour ce post
  SELECT EXISTS (
    SELECT 1
    FROM public.match_requests mr
    WHERE mr.related_post_id = NEW.shared_post_id
      AND mr.status = 'accepted'
      AND (
        (mr.from_user_id = conv.user1_id AND mr.to_user_id = conv.user2_id)
        OR
        (mr.from_user_id = conv.user2_id AND mr.to_user_id = conv.user1_id)
      )
  ) INTO has_accepted;

  IF NOT has_accepted THEN
    RAISE EXCEPTION 'Accès messagerie bloqué: la demande doit être acceptée avant tout message lié à une annonce.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_post_message_requires_accepted_request ON public.messages;
CREATE TRIGGER trg_enforce_post_message_requires_accepted_request
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_post_message_requires_accepted_request();

COMMIT;
