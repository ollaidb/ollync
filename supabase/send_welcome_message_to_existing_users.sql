-- Envoi du message de bienvenue aux utilisateurs existants
-- Ce script envoie le message uniquement si aucun message de bienvenue
-- n'existe deja entre "ollync" et l'utilisateur.
-- Pre-requis : la fonction public.create_welcome_message() doit exister.

-- Diagnostic rapide : verifie le profil Ollync
SELECT
  id,
  email,
  username
FROM public.profiles
WHERE lower(username) = 'ollync'
   OR lower(email) = 'binta22116@gmail.com';


DO $$
DECLARE
  v_system_user_id UUID;
  v_total_targets INTEGER;
BEGIN
  SELECT id
  INTO v_system_user_id
  FROM public.profiles
  WHERE lower(username) = 'ollync'
     OR lower(email) = 'binta22116@gmail.com'
  ORDER BY (username IS NOT NULL) DESC
  LIMIT 1;

  IF v_system_user_id IS NULL THEN
    RAISE WARNING 'Aucun profil Ollync trouve (username=ollync ou email=binta22116@gmail.com).';
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_total_targets
  FROM public.profiles p
  WHERE p.id <> v_system_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.messages m ON m.conversation_id = c.id
      WHERE c.is_group = false
        AND (
          (c.user1_id = v_system_user_id AND c.user2_id = p.id)
          OR (c.user1_id = p.id AND c.user2_id = v_system_user_id)
        )
        AND m.sender_id = v_system_user_id
        AND m.message_type = 'text'
        AND m.content ILIKE 'Bienvenue sur Ollync%'
    );

  RAISE NOTICE 'Utilisateurs a traiter: %', v_total_targets;

  PERFORM public.create_welcome_message(p.id)
  FROM public.profiles p
  WHERE p.id <> v_system_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.messages m ON m.conversation_id = c.id
      WHERE c.is_group = false
        AND (
          (c.user1_id = v_system_user_id AND c.user2_id = p.id)
          OR (c.user1_id = p.id AND c.user2_id = v_system_user_id)
        )
        AND m.sender_id = v_system_user_id
        AND m.message_type = 'text'
        AND m.content ILIKE 'Bienvenue sur Ollync%'
    );

  RAISE NOTICE 'Envoi termine.';
END $$;
