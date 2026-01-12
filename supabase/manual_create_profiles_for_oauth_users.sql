-- ============================================
-- SCRIPT POUR CRÉER MANUELLEMENT LES PROFILS
-- POUR LES UTILISATEURS OAuth SANS PROFIL
-- ============================================
-- Ce script crée automatiquement les profils pour tous les utilisateurs OAuth
-- (Google/Apple) qui n'ont pas encore de profil dans la table profiles

-- 1. Créer les profils manquants pour tous les utilisateurs OAuth
INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    NULL
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'username',
    NULL
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture',
    NULL
  ) as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
AND p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  username = COALESCE(EXCLUDED.username, profiles.username),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  updated_at = NOW();

-- 2. Afficher les résultats
SELECT 
  COUNT(*) as profiles_created
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
);

-- 3. Vérifier les profils créés
SELECT 
  au.id,
  au.email,
  au.raw_app_meta_data->>'provider' as provider,
  au.raw_user_meta_data->>'full_name' as full_name_from_meta,
  p.full_name as full_name_in_profile,
  p.avatar_url,
  p.created_at as profile_created_at
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
ORDER BY p.created_at DESC;

