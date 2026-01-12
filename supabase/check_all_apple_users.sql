-- ============================================
-- VÉRIFIER TOUS LES UTILISATEURS APPLE
-- ============================================
-- Cette requête vérifie si des utilisateurs Apple existent dans auth.users

-- 1. Compter TOUS les utilisateurs Apple
SELECT 
  '📊 TOTAL UTILISATEURS APPLE' as info,
  COUNT(*) as nombre
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple';

-- 2. Lister TOUS les utilisateurs Apple (si il y en a)
SELECT 
  '👤 LISTE UTILISATEURS APPLE' as info,
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple'
ORDER BY created_at DESC;

-- 3. Vérifier TOUS les providers utilisés
SELECT 
  '🔍 TOUS LES PROVIDERS' as info,
  raw_app_meta_data->>'provider' as provider,
  COUNT(*) as nombre
FROM auth.users
GROUP BY raw_app_meta_data->>'provider'
ORDER BY nombre DESC;
