-- ============================================
-- Autoriser la suppression de ses propres annonces (table posts)
-- ============================================
-- L'erreur "post_id_locked" peut venir d'un trigger OU d'une politique RLS
-- sur posts (une politique qui appelle une fonction levant cette exception).
-- Ce script supprime tout ce qui peut bloquer puis recrée le strict nécessaire.

-- 1) Supprimer TOUS les triggers sur la table posts (sans exception)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'posts'
      AND n.nspname = 'public'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.posts', r.trigger_name);
    RAISE NOTICE 'Trigger supprimé : %', r.trigger_name;
  END LOOP;
END
$$;

-- 2) Recréer uniquement le trigger qui met à jour updated_at (BEFORE UPDATE)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Supprimer TOUTES les politiques DELETE sur posts (lecture via pg_policy, pas la vue)
--    puis recréer une seule politique simple (sans appel de fonction)
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  FOR pol_record IN
    SELECT pol.polname
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'posts'
      AND pol.polcmd = 'd'  -- politiques qui s'appliquent au DELETE uniquement
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.posts', pol_record.polname);
    RAISE NOTICE 'Politique DELETE supprimée sur posts : %', pol_record.polname;
  END LOOP;
END
$$;

CREATE POLICY "users_can_delete_own_posts" ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4) RPC qui supprime l'annonce en désactivant les triggers sur posts ET sur les tables liées
--    (match_requests, applications, etc. peuvent avoir un trigger qui lève post_id_locked au CASCADE)
CREATE OR REPLACE FUNCTION public.delete_own_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_deleted INT;
  t TEXT;
  tables_to_disable TEXT[] := ARRAY['posts', 'match_requests', 'applications', 'likes', 'comments', 'shares', 'favorites', 'contracts', 'conversations', 'messages', 'notifications'];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'non_authentifie');
  END IF;

  -- Désactiver les triggers sur posts et sur les tables liées (ignorer si la table n'existe pas)
  FOREACH t IN ARRAY tables_to_disable
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', t);
    EXCEPTION WHEN undefined_table OR OTHERS THEN
      NULL;
    END;
  END LOOP;

  BEGIN
    WITH deleted AS (
      DELETE FROM public.posts
      WHERE id = p_post_id AND user_id = v_user_id
      RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_deleted FROM deleted;

    -- Réactiver les triggers (même ordre)
    FOREACH t IN ARRAY tables_to_disable
    LOOP
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
      EXCEPTION WHEN undefined_table OR OTHERS THEN
        NULL;
      END;
    END LOOP;

    IF v_deleted = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'post_introuvable_ou_interdit');
    END IF;
    RETURN jsonb_build_object('ok', true);
  EXCEPTION
    WHEN OTHERS THEN
      FOREACH t IN ARRAY tables_to_disable
      LOOP
        BEGIN
          EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
      RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION public.delete_own_post(UUID) IS 'Supprime une annonce (propriétaire uniquement). Désactive les triggers pour contourner post_id_locked.';
