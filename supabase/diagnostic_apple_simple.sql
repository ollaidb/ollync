-- ============================================
-- DIAGNOSTIC SIMPLE APPLE OAUTH - VUE RAPIDE
-- ============================================
-- Ce script affiche toutes les informations importantes en une seule vue

-- 1. LE TRIGGER EXISTE-T-IL ?
SELECT 
  '✅ TRIGGER EXISTE' as status,
  trigger_name,
  event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  '❌ TRIGGER MANQUANT' as status,
  NULL as trigger_name,
  NULL as table_name
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created'
);

-- 2. UTILISATEURS APPLE SANS PROFIL (LE PROBLÈME PROBABLE)
SELECT 
  '❌ UTILISATEURS APPLE SANS PROFIL' as probleme,
  au.id,
  au.email,
  au.created_at::text as date_creation,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Sans nom') as nom
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
  AND p.id IS NULL
ORDER BY au.created_at DESC;

-- 3. STATISTIQUES GLOBALES
SELECT 
  '📊 STATISTIQUES' as type_info,
  COUNT(DISTINCT au.id)::text as total_users_apple,
  COUNT(DISTINCT p.id)::text as total_profiles_apple,
  (COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id))::text as users_sans_profil,
  CASE 
    WHEN COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) > 0 THEN '❌ PROBLÈME DÉTECTÉ'
    ELSE '✅ TOUS LES UTILISATEURS ONT UN PROFIL'
  END as diagnostic
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple';

-- 4. LISTE TOUS LES UTILISATEURS APPLE (pour vérification)
SELECT 
  '👤 UTILISATEURS APPLE' as type_info,
  au.id,
  au.email,
  au.created_at::text as date_creation,
  CASE WHEN p.id IS NULL THEN '❌ PAS DE PROFIL' ELSE '✅ PROFIL OK' END as status_profil,
  COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Sans nom') as nom
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
ORDER BY au.created_at DESC;
