-- ============================================
-- STATS MODÉRATION + ACCÈS LECTURE PROFILS POUR MODÉRATEUR
-- ============================================
-- Permet au modérateur de voir le nombre d'utilisateurs et d'utiliser get_moderation_stats.
-- Exécutez dans le SQL Editor Supabase.

-- Politique : le modérateur peut lire les profils (pour stats et contexte)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Moderator can view all profiles'
  ) THEN
    CREATE POLICY "Moderator can view all profiles" ON profiles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND lower(p.email) = 'binta22116@gmail.com'
        )
      );
  END IF;
END $$;

-- Fonction RPC : statistiques modération (réservée au modérateur)
CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email TEXT;
  result JSONB;
  v_total_users BIGINT;
  v_total_posts BIGINT;
  v_posts_7d BIGINT;
  v_posts_30d BIGINT;
  v_pending_reports BIGINT;
  v_profile_reports BIGINT;
  v_post_reports BIGINT;
  v_flagged_posts BIGINT;
  v_suspicious_count BIGINT;
BEGIN
  SELECT email INTO current_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF lower(trim(current_email)) <> 'binta22116@gmail.com' THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT count(*) INTO v_total_users FROM profiles;
  SELECT count(*) INTO v_total_posts FROM posts;
  SELECT count(*) INTO v_posts_7d FROM posts WHERE created_at >= (now() - interval '7 days');
  SELECT count(*) INTO v_posts_30d FROM posts WHERE created_at >= (now() - interval '30 days');
  SELECT count(*) INTO v_pending_reports FROM reports WHERE status = 'pending';
  SELECT count(*) INTO v_profile_reports FROM reports WHERE report_type = 'profile';
  SELECT count(*) INTO v_post_reports FROM reports WHERE report_type = 'post';
  SELECT count(*) INTO v_flagged_posts FROM posts WHERE moderation_status = 'flagged';

  BEGIN
    SELECT count(*) INTO v_suspicious_count FROM public.suspicious_activity;
  EXCEPTION WHEN undefined_table THEN
    v_suspicious_count := 0;
  END;

  result := jsonb_build_object(
    'total_users', v_total_users,
    'total_posts', v_total_posts,
    'posts_last_7_days', v_posts_7d,
    'posts_last_30_days', v_posts_30d,
    'pending_reports', v_pending_reports,
    'profile_reports_count', v_profile_reports,
    'post_reports_count', v_post_reports,
    'flagged_posts_count', v_flagged_posts,
    'suspicious_activity_count', v_suspicious_count
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_moderation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_stats() TO service_role;

COMMENT ON FUNCTION public.get_moderation_stats() IS 'Retourne les statistiques de modération (réservé au compte modérateur).';
