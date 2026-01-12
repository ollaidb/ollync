-- ============================================
-- SCRIPT DE DEBUG POUR VERIFIER LE PROBLÈME OAuth
-- ============================================
-- Ce script permet de diagnostiquer pourquoi les profils ne sont pas créés

-- 1. Vérifier si le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Vérifier si la fonction handle_new_user existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 3. Lister les utilisateurs OAuth (Google/Apple) sans profil
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.raw_user_meta_data->>'picture' as picture,
  au.created_at as auth_created_at,
  p.id as profile_id,
  p.email as profile_email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
AND p.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Compter les utilisateurs OAuth avec et sans profil
SELECT 
  COUNT(DISTINCT au.id) as total_oauth_users,
  COUNT(DISTINCT p.id) as oauth_users_with_profile,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as oauth_users_without_profile
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
);

-- 5. Vérifier les dernières créations d'utilisateurs OAuth
SELECT 
  au.id,
  au.email,
  au.raw_app_meta_data->>'provider' as provider,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Profil existe'
    ELSE 'PROFIL MANQUANT ❌'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
ORDER BY au.created_at DESC
LIMIT 10;

-- 6. Tester manuellement la création d'un profil pour un utilisateur OAuth sans profil
-- Remplacez 'USER_ID_HERE' par l'ID d'un utilisateur sans profil
-- Décommentez les lignes suivantes et exécutez après avoir trouvé un USER_ID :
/*
DO $$
DECLARE
  test_user_id UUID := 'USER_ID_HERE'::UUID;
  test_email TEXT;
  test_full_name TEXT;
  test_avatar_url TEXT;
BEGIN
  -- Récupérer les données de l'utilisateur
  SELECT email, 
         raw_user_meta_data->>'full_name',
         COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')
  INTO test_email, test_full_name, test_avatar_url
  FROM auth.users
  WHERE id = test_user_id;
  
  -- Créer le profil
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (test_user_id, test_email, test_full_name, test_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  
  RAISE NOTICE 'Profil créé pour l''utilisateur %', test_user_id;
END $$;
*/

