-- ============================================
-- CONVERSATIONS NE DOIVENT PAS ÊTRE SUPPRIMÉES À CAUSE D'UN POST
-- ============================================
-- Problème : avec "post_id REFERENCES posts(id) ON DELETE CASCADE",
-- la suppression d'un post (ou d'une ligne dans posts) supprimait
-- toutes les conversations liées et tous leurs messages.
--
-- Ce script remplace CASCADE par SET NULL : si un post est supprimé,
-- la conversation reste, avec post_id = NULL. Les messages restent.
-- Exécutez dans le SQL Editor Supabase.

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
    EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS %I', fk_name);
    RAISE NOTICE 'Contrainte FK CASCADE supprimée : %', fk_name;

    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Contrainte ON DELETE SET NULL ajoutée.';
  ELSIF fk_name IS NOT NULL THEN
    RAISE NOTICE 'La FK post_id existe déjà et n''est pas en CASCADE (rien à faire).';
  ELSE
    RAISE NOTICE 'Aucune FK post_id trouvée sur conversations.';
  END IF;
END $$;

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ conversations.post_id utilise maintenant ON DELETE SET NULL.';
  RAISE NOTICE 'Les conversations et messages ne seront plus supprimés quand un post est supprimé.';
END $$;
