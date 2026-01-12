-- ============================================
-- DIAGNOSTIC COMPLET APPLE OAUTH
-- ============================================
-- Ce script analyse complètement la base de données pour identifier
-- les problèmes avec l'authentification Apple OAuth

-- 1. VÉRIFIER SI LE TRIGGER EXISTE
SELECT 
  '=== VÉRIFICATION DU TRIGGER ===' as section,
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. LISTER TOUS LES UTILISATEURS APPLE
SELECT 
  '=== UTILISATEURS APPLE DANS auth.users ===' as section,
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name_meta,
  raw_user_meta_data->>'name' as name_meta,
  raw_user_meta_data->>'avatar_url' as avatar_url_meta,
  raw_user_meta_data->>'picture' as picture_meta,
  raw_user_meta_data as all_metadata
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple'
ORDER BY created_at DESC;

-- 3. VÉRIFIER LES UTILISATEURS APPLE SANS PROFIL
SELECT 
  '=== UTILISATEURS APPLE SANS PROFIL ===' as section,
  au.id,
  au.email,
  au.created_at as user_created_at,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'name' as name,
  'PROFIL MANQUANT' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
  AND p.id IS NULL
ORDER BY au.created_at DESC;

-- 4. VÉRIFIER LES PROFILS DES UTILISATEURS APPLE
SELECT 
  '=== PROFILS DES UTILISATEURS APPLE ===' as section,
  p.id,
  p.email,
  p.full_name,
  p.username,
  p.avatar_url,
  p.created_at as profile_created_at,
  au.created_at as user_created_at,
  CASE 
    WHEN p.created_at > au.created_at THEN 'Profil créé après utilisateur'
    WHEN p.created_at < au.created_at THEN 'Profil créé avant utilisateur (anormal)'
    ELSE 'Créés en même temps'
  END as timing_status
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
ORDER BY p.created_at DESC;

-- 5. COMPTER LES UTILISATEURS APPLE AVEC ET SANS PROFIL
SELECT 
  '=== STATISTIQUES ===' as section,
  COUNT(DISTINCT au.id) as total_users_apple,
  COUNT(DISTINCT p.id) as total_profiles_apple,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as users_sans_profil
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple';

-- 6. VÉRIFIER LA FONCTION handle_new_user
SELECT 
  '=== VÉRIFICATION DE LA FONCTION ===' as section,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 7. DÉTAILS COMPLETS DES DERNIERS UTILISATEURS APPLE (pour debug)
SELECT 
  '=== DÉTAILS COMPLETS DES 5 DERNIERS UTILISATEURS APPLE ===' as section,
  au.id,
  au.email,
  au.created_at,
  au.raw_app_meta_data as app_metadata,
  au.raw_user_meta_data as user_metadata,
  p.id as profile_id,
  p.full_name as profile_full_name,
  p.email as profile_email,
  CASE WHEN p.id IS NULL THEN 'PROFIL MANQUANT' ELSE 'Profil existe' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
ORDER BY au.created_at DESC
LIMIT 5;
