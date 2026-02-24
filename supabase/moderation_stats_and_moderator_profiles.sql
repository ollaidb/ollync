-- ============================================
-- STATS MODÉRATION + ACCÈS LECTURE PROFILS POUR MODÉRATEUR
-- ============================================
-- Permet au modérateur de voir le nombre d'utilisateurs et d'utiliser get_moderation_stats.
-- Exécutez dans le SQL Editor Supabase.

-- Fonction helper pour éviter la récursion RLS (la politique ne doit pas faire SELECT sur profiles)
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND lower(trim(email)) = 'binta22116@gmail.com'
  );
$$;

-- Politique : le modérateur peut lire les profils (pour stats et contexte)
-- On utilise is_moderator() pour éviter une récursion infinie (policy qui lit profiles)
DROP POLICY IF EXISTS "Moderator can view all profiles" ON profiles;
CREATE POLICY "Moderator can view all profiles" ON profiles
  FOR SELECT
  USING (public.is_moderator());

-- Fonction RPC : statistiques modération (réservée au modérateur)
-- Inclut : profils, en temps réel (is_online), par statut, répartition par catégorie
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
  v_users_online BIGINT;
  v_total_posts BIGINT;
  v_posts_7d BIGINT;
  v_posts_30d BIGINT;
  v_pending_reports BIGINT;
  v_reviewed_reports BIGINT;
  v_resolved_reports BIGINT;
  v_dismissed_reports BIGINT;
  v_profile_reports BIGINT;
  v_post_reports BIGINT;
  v_flagged_posts BIGINT;
  v_suspicious_count BIGINT;
  v_category_json JSONB;
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
  SELECT count(*) INTO v_reviewed_reports FROM reports WHERE status = 'reviewed';
  SELECT count(*) INTO v_resolved_reports FROM reports WHERE status = 'resolved';
  SELECT count(*) INTO v_dismissed_reports FROM reports WHERE status = 'dismissed';
  SELECT count(*) INTO v_profile_reports FROM reports WHERE report_type = 'profile';
  SELECT count(*) INTO v_post_reports FROM reports WHERE report_type = 'post';
  SELECT count(*) INTO v_flagged_posts FROM posts WHERE moderation_status = 'flagged';

  BEGIN
    SELECT count(*) INTO v_users_online FROM profiles WHERE is_online = true;
  EXCEPTION WHEN undefined_column THEN
    v_users_online := 0;
  END;

  BEGIN
    SELECT count(*) INTO v_suspicious_count FROM public.suspicious_activity;
  EXCEPTION WHEN undefined_table THEN
    v_suspicious_count := 0;
  END;

  SELECT coalesce(
    (SELECT jsonb_agg(obj) FROM (
      SELECT jsonb_build_object(
        'category_name', row.name,
        'slug', row.slug,
        'user_count', row.user_count,
        'percentage', CASE WHEN v_total_users > 0 THEN round((row.user_count::numeric / v_total_users::numeric) * 100, 1) ELSE 0 END
      ) AS obj
      FROM (
        SELECT c.name, c.slug, count(DISTINCT p.user_id)::BIGINT AS user_count
        FROM posts p
        JOIN categories c ON c.id = p.category_id
        GROUP BY c.id, c.name, c.slug
        ORDER BY count(DISTINCT p.user_id) DESC
      ) row
    ) sub),
    '[]'::jsonb
  ) INTO v_category_json;

  result := jsonb_build_object(
    'total_users', v_total_users,
    'users_with_profile', v_total_users,
    'users_online', coalesce(v_users_online, 0),
    'total_posts', v_total_posts,
    'posts_last_7_days', v_posts_7d,
    'posts_last_30_days', v_posts_30d,
    'pending_reports', v_pending_reports,
    'reports_by_status', jsonb_build_object(
      'pending', v_pending_reports,
      'reviewed', v_reviewed_reports,
      'resolved', v_resolved_reports,
      'dismissed', v_dismissed_reports
    ),
    'profile_reports_count', v_profile_reports,
    'post_reports_count', v_post_reports,
    'flagged_posts_count', v_flagged_posts,
    'suspicious_activity_count', v_suspicious_count,
    'category_breakdown', coalesce(v_category_json, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_moderation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_stats() TO service_role;

COMMENT ON FUNCTION public.get_moderation_stats() IS 'Retourne les statistiques de modération (réservé au compte modérateur).';
