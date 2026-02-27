-- ============================================
-- PROTECTION DES DONNÉES : ON NE SUPPRIME PAS FACILEMENT
-- ============================================
-- Règle : annonces publiées, réponses (messages), traces (historique) ne sont
-- jamais supprimées en base. On utilise uniquement du "soft delete" (marquage)
-- pour que les données restent et que l'app affiche "supprimé" ou masque.
--
-- Ce script :
-- 1. Annonces (posts) : uniquement soft delete (status = 'deleted'), pas de DELETE
-- 2. Modération : delete_post_as_admin marque l'annonce comme supprimée, ne la supprime pas
-- 3. Traces (search_history) : plus de suppression possible (historique conservé)
-- Exécutez UNE FOIS dans le SQL Editor Supabase.
-- ============================================

BEGIN;

-- ============================================
-- 1. POSTS : statut 'deleted' autorisé + contrainte
-- ============================================
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_check_status;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('active', 'archived', 'completed', 'draft', 'sold', 'pending', 'deleted'));

-- ============================================
-- 2. SUPPRIMER TOUTES LES POLITIQUES DELETE SUR POSTS
--    Personne ne peut faire DELETE sur posts (ni l'app ni un admin via client)
-- ============================================
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
      AND pol.polcmd = 'd'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.posts', pol_record.polname);
    RAISE NOTICE 'Politique DELETE supprimée sur posts : %', pol_record.polname;
  END LOOP;
END $$;

-- ============================================
-- 3. delete_own_post : UNIQUEMENT soft delete (UPDATE status)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_own_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_updated INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'non_authentifie');
  END IF;

  UPDATE public.posts
  SET status = 'deleted', updated_at = NOW()
  WHERE id = p_post_id AND user_id = v_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'post_introuvable_ou_interdit');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.delete_own_post(UUID) IS 'Marque une annonce comme supprimée (status=deleted). Aucune suppression physique : annonces, traces et références restent en base.';

-- ============================================
-- 4. delete_post_as_admin : soft delete aussi (modération)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_post_as_admin(target_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
  v_updated INT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez etre connecte';
  END IF;

  SELECT email INTO current_email
  FROM public.profiles
  WHERE id = current_user_id;

  IF current_email IS NULL OR lower(trim(current_email)) <> 'binta22116@gmail.com' THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  UPDATE public.posts
  SET status = 'deleted', updated_at = NOW()
  WHERE id = target_post_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Annonce introuvable';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.delete_post_as_admin(UUID) IS 'Marque une annonce comme supprimée (modération). Soft delete : pas de suppression physique.';

-- ============================================
-- 5. TRACES : supprimer la politique DELETE sur search_history
--    L'historique des recherches n'est plus supprimable (traces conservées)
-- ============================================
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_history') THEN
    RAISE NOTICE 'Table search_history absente, skip.';
    RETURN;
  END IF;
  FOR pol_record IN
    SELECT pol.polname
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'search_history'
      AND pol.polcmd = 'd'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.search_history', pol_record.polname);
    RAISE NOTICE 'Politique DELETE supprimée sur search_history (traces) : %', pol_record.polname;
  END LOOP;
END $$;

-- ============================================
-- 6. MESSAGES : s'assurer qu'il n'y a pas de politique DELETE
--    Les messages ne se suppriment qu'en soft delete (is_deleted, deleted_for_user_id)
-- ============================================
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
      AND c.relname = 'messages'
      AND pol.polcmd = 'd'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', pol_record.polname);
    RAISE NOTICE 'Politique DELETE supprimée sur messages : %', pol_record.polname;
  END LOOP;
END $$;

COMMIT;

-- ============================================
-- RÉSUMÉ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Données protégées (pas de suppression facile)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- Annonces (posts) : soft delete uniquement (status=deleted), aucune politique DELETE.';
  RAISE NOTICE '- Modération delete_post_as_admin : marque comme supprimée, ne supprime pas la ligne.';
  RAISE NOTICE '- Traces (search_history) : politique DELETE retirée, historique conservé.';
  RAISE NOTICE '- Messages : pas de DELETE direct (soft delete déjà en place).';
  RAISE NOTICE '========================================';
END $$;
