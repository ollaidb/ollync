-- ============================================
-- Soft delete pour les annonces (supprimée/retirée)
-- ============================================
-- Au lieu de supprimer définitivement le post, on met status = 'deleted'.
-- Les likes, match_requests et messages gardent leur référence (post_id).
-- L'app affiche "Annonce supprimée" partout où il y a une interaction.

-- 1) Ajouter 'deleted' aux statuts autorisés pour posts
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_check_status;
ALTER TABLE posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('active', 'archived', 'completed', 'draft', 'sold', 'pending', 'deleted'));

-- 2) Remplacer delete_own_post : UPDATE status au lieu de DELETE
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

COMMENT ON FUNCTION public.delete_own_post(UUID) IS 'Marque une annonce comme supprimée (status=deleted). Soft delete pour conserver les références (likes, match_requests, messages).';
