-- ============================================
-- SCRIPT POUR SYNCHRONISER LES DONNÉES OAUTH
-- ============================================
-- Ce script met à jour les profils existants avec les données OAuth
-- depuis auth.users si elles sont manquantes dans profiles

-- Mettre à jour les profils OAuth avec les données depuis auth.users
UPDATE public.profiles p
SET 
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(
    NULLIF(p.full_name, ''),
    p.full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    NULL
  ),
  username = COALESCE(
    NULLIF(p.username, ''),
    p.username,
    au.raw_user_meta_data->>'username',
    NULL
  ),
  avatar_url = COALESCE(
    NULLIF(p.avatar_url, ''),
    p.avatar_url,
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture',
    NULL
  ),
  updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
AND (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
AND (
  -- Mettre à jour si des données sont manquantes
  p.full_name IS NULL 
  OR p.full_name = ''
  OR p.avatar_url IS NULL
  OR p.avatar_url = ''
  OR (p.email IS NULL AND au.email IS NOT NULL)
);

-- Afficher les résultats
SELECT 
  'Profils OAuth synchronisés' as message,
  COUNT(*) as total_profils_synchronises
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
AND p.full_name IS NOT NULL
AND p.full_name != '';

-- Afficher les profils OAuth avec leurs données
SELECT 
  au.id,
  au.email as email_auth,
  p.email as email_profile,
  au.raw_user_meta_data->>'full_name' as full_name_auth,
  p.full_name as full_name_profile,
  au.raw_user_meta_data->>'avatar_url' as avatar_url_auth,
  p.avatar_url as avatar_url_profile,
  au.raw_app_meta_data->>'provider' as provider
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE (
  au.raw_app_meta_data->>'provider' = 'google' 
  OR au.raw_app_meta_data->>'provider' = 'apple'
)
ORDER BY p.updated_at DESC;

