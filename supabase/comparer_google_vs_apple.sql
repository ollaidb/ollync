-- ============================================
-- COMPARAISON GOOGLE (✅ Fonctionne) VS APPLE (❌ Ne Fonctionne Pas)
-- ============================================

-- 1. Voir les utilisateurs Google (qui fonctionnent)
SELECT 
  '✅ UTILISATEURS GOOGLE (Fonctionnent)' as type,
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'picture' as picture,
  jsonb_pretty(raw_user_meta_data) as all_metadata
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY created_at DESC
LIMIT 3;

-- 2. Voir si des utilisateurs Apple existent (même en erreur)
SELECT 
  '❌ UTILISATEURS APPLE (Problème)' as type,
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name,
  jsonb_pretty(raw_user_meta_data) as all_metadata
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Comparer les profils Google vs Apple
SELECT 
  '📊 PROFILS GOOGLE VS APPLE' as type,
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.created_at as profile_created_at,
  au.created_at as user_created_at,
  au.raw_app_meta_data->>'provider' as provider
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE au.raw_app_meta_data->>'provider' IN ('google', 'apple')
ORDER BY p.created_at DESC;

-- 4. Statistiques
SELECT 
  '📈 STATISTIQUES' as type,
  COUNT(DISTINCT CASE WHEN au.raw_app_meta_data->>'provider' = 'google' THEN au.id END) as total_google,
  COUNT(DISTINCT CASE WHEN au.raw_app_meta_data->>'provider' = 'apple' THEN au.id END) as total_apple,
  COUNT(DISTINCT CASE WHEN au.raw_app_meta_data->>'provider' = 'google' AND p.id IS NOT NULL THEN au.id END) as google_avec_profil,
  COUNT(DISTINCT CASE WHEN au.raw_app_meta_data->>'provider' = 'apple' AND p.id IS NOT NULL THEN au.id END) as apple_avec_profil
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' IN ('google', 'apple');
