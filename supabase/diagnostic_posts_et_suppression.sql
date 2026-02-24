-- ============================================
-- Diagnostic : annonces et blocage de suppression
-- ============================================
-- À exécuter dans Supabase SQL Editor (tout le script d’un coup, ou bloc par bloc).
-- Les requêtes 1 et 2 ne touchent pas aux tables posts/profiles, donc pas d’erreur array_agg.

-- ---------- 1) Triggers sur la table posts ----------
SELECT
  t.tgname AS trigger_name,
  CASE WHEN (t.tgtype & 2) != 0 THEN 'BEFORE' WHEN (t.tgtype & 4) != 0 THEN 'AFTER' ELSE 'INSTEAD OF' END AS timing,
  CASE WHEN (t.tgtype & 16) != 0 THEN 'INSERT ' ELSE '' END ||
  CASE WHEN (t.tgtype & 32) != 0 THEN 'DELETE ' ELSE '' END ||
  CASE WHEN (t.tgtype & 64) != 0 THEN 'UPDATE' ELSE '' END AS events,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'posts' AND n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ---------- 2) Fonctions qui contiennent "post_id_locked" ----------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%post_id_locked%';

-- (Les politiques RLS ne sont pas listées ici pour éviter l'erreur
--  "array_agg is an aggregate function" sur la table profiles.
--  Pour les voir : Supabase → Table Editor → posts / profiles → onglet Policies.)
