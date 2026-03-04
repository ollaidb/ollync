-- Guard messagerie liée aux annonces (version SAFE)
-- Si les tables de messagerie n'existent pas encore, le script n'échoue pas.

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    RAISE NOTICE 'Table public.messages absente. Exécutez d''abord create_messaging_tables.sql';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    RAISE NOTICE 'Table public.conversations absente. Exécutez d''abord create_messaging_tables.sql';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'match_requests'
  ) THEN
    RAISE NOTICE 'Table public.match_requests absente. Exécutez d''abord create_messaging_tables.sql';
    RETURN;
  END IF;

  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.enforce_post_message_requires_accepted_request()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      conv record;
      has_accepted boolean;
    BEGIN
      IF NEW.shared_post_id IS NULL THEN
        RETURN NEW;
      END IF;

      SELECT c.user1_id, c.user2_id, c.is_group
      INTO conv
      FROM public.conversations c
      WHERE c.id = NEW.conversation_id;

      IF conv IS NULL THEN
        RAISE EXCEPTION 'Conversation introuvable';
      END IF;

      IF COALESCE(conv.is_group, false) = true THEN
        RETURN NEW;
      END IF;

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
    $func$;

    DROP TRIGGER IF EXISTS trg_enforce_post_message_requires_accepted_request ON public.messages;
    CREATE TRIGGER trg_enforce_post_message_requires_accepted_request
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_post_message_requires_accepted_request();
  $sql$;
END
$do$;
