-- ============================================
-- PERSISTANCE TOTALE DU CONTENU DES CONVERSATIONS
-- ============================================
-- Règle : tout ce qui est envoyé dans une conversation reste (messages,
-- photos, annonces partagées, rendez-vous, liens, etc.) jusqu'à ce que
-- l'utilisateur choisisse explicitement de supprimer ses données.
--
-- Ce script modifie les contraintes ON DELETE CASCADE en ON DELETE SET NULL
-- pour que la suppression d'un post, d'un profil ou d'un message ne supprime
-- pas les conversations, messages et rendez-vous. Les lignes restent avec
-- des références NULL là où l'entité a été supprimée.
--
-- Exécutez ce script UNE FOIS dans le SQL Editor Supabase.
-- ============================================

BEGIN;

-- ============================================
-- 1. CONVERSATIONS : post_id → SET NULL
-- ============================================
DO $$
DECLARE
  fk_name text;
  fk_del_type "char";
BEGIN
  SELECT c.conname, c.confdeltype INTO fk_name, fk_del_type
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
  WHERE c.contype = 'f'
    AND c.conrelid = 'public.conversations'::regclass
    AND c.confrelid = 'public.posts'::regclass
    AND a.attname = 'post_id'
  LIMIT 1;

  IF fk_name IS NOT NULL AND fk_del_type = 'c' THEN
    EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT %I', fk_name);
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;
    RAISE NOTICE '1. conversations.post_id → ON DELETE SET NULL';
  ELSIF fk_name IS NOT NULL THEN
    RAISE NOTICE '1. conversations.post_id déjà en SET NULL';
  ELSE
    RAISE NOTICE '1. Pas de FK post_id sur conversations';
  END IF;
END $$;

-- ============================================
-- 2. CONVERSATIONS : user1_id, user2_id → SET NULL
--    (si un utilisateur supprime son compte, la conversation reste pour l'autre)
-- ============================================
DO $$
DECLARE
  r record;
  has_fk boolean;
BEGIN
  FOR r IN (
    SELECT c.conname, a.attname AS colname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f'
      AND c.conrelid = 'public.conversations'::regclass
      AND c.confrelid = 'public.profiles'::regclass
      AND a.attname IN ('user1_id', 'user2_id')
      AND c.confdeltype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE '2. Contrainte CASCADE supprimée : % (%)', r.conname, r.colname;
  END LOOP;

  ALTER TABLE public.conversations ALTER COLUMN user1_id DROP NOT NULL;
  ALTER TABLE public.conversations ALTER COLUMN user2_id DROP NOT NULL;

  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.conversations'::regclass AND a.attname = 'user1_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_user1_id_fkey
      FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '2. conversations.user1_id → ON DELETE SET NULL';
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.conversations'::regclass AND a.attname = 'user2_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_user2_id_fkey
      FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '2. conversations.user2_id → ON DELETE SET NULL';
  END IF;
END $$;

-- ============================================
-- 3. MESSAGES : sender_id → SET NULL
--    (les messages restent même si l'expéditeur supprime son compte)
-- ============================================
DO $$
DECLARE
  fk_name text;
  fk_del_type "char";
BEGIN
  SELECT c.conname, c.confdeltype INTO fk_name, fk_del_type
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
  WHERE c.contype = 'f'
    AND c.conrelid = 'public.messages'::regclass
    AND c.confrelid = 'public.profiles'::regclass
    AND a.attname = 'sender_id'
  LIMIT 1;

  IF fk_name IS NOT NULL AND fk_del_type = 'c' THEN
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I', fk_name);
    ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '3. messages.sender_id → ON DELETE SET NULL (colonne nullable)';
  ELSIF fk_name IS NOT NULL THEN
    RAISE NOTICE '3. messages.sender_id déjà en SET NULL';
  ELSE
    RAISE NOTICE '3. Pas de FK sender_id sur messages';
  END IF;
END $$;

-- ============================================
-- 4. APPOINTMENTS : message_id, conversation_id, sender_id, recipient_id → SET NULL
--    (les rendez-vous restent même si message, conversation ou utilisateur est supprimé)
-- ============================================
DO $$
DECLARE
  r record;
  has_fk boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    RAISE NOTICE '4. Table appointments absente, skip.';
    RETURN;
  END IF;

  FOR r IN (
    SELECT c.conname, a.attname AS colname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f'
      AND c.conrelid = 'public.appointments'::regclass
      AND a.attname IN ('message_id', 'conversation_id', 'sender_id', 'recipient_id')
      AND c.confdeltype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS %I', r.conname);
    EXECUTE format('ALTER TABLE public.appointments ALTER COLUMN %I DROP NOT NULL', r.colname);
    RAISE NOTICE '4. appointments.% : CASCADE supprimé, colonne nullable', r.colname;
  END LOOP;

  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.appointments'::regclass AND a.attname = 'message_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_message_id_fkey
      FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.appointments'::regclass AND a.attname = 'conversation_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.appointments'::regclass AND a.attname = 'sender_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  SELECT NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1] AND NOT a.attisdropped
    WHERE c.contype = 'f' AND c.conrelid = 'public.appointments'::regclass AND a.attname = 'recipient_id') INTO has_fk;
  IF has_fk THEN
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_recipient_id_fkey
      FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  RAISE NOTICE '4. appointments : FKs en ON DELETE SET NULL';
END $$;

-- ============================================
-- 5. (Supprimé : conversation_user_states garde CASCADE pour éviter conflit UNIQUE)
-- ============================================

COMMIT;

-- ============================================
-- RÉSUMÉ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Persistance des conversations appliquée.';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Conservés jusqu''à suppression explicite par l''utilisateur :';
  RAISE NOTICE '  - Conversations (même si post ou un utilisateur est supprimé)';
  RAISE NOTICE '  - Messages, photos, liens, annonces partagées';
  RAISE NOTICE '  - Rendez-vous (appointments)';
  RAISE NOTICE '========================================';
END $$;
