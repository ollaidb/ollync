-- ============================================
-- VÉRIFIER SI UN EMAIL EXISTE DÉJÀ
-- ============================================
-- Remplacez 'VOTRE_EMAIL_ICI' par votre email réel

-- 1. Vérifier dans auth.users
SELECT 
  '📧 COMPTES DANS auth.users' as info,
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  CASE 
    WHEN raw_app_meta_data->>'provider' IS NULL THEN 'email/password'
    ELSE raw_app_meta_data->>'provider'
  END as auth_method
FROM auth.users
WHERE email = 'VOTRE_EMAIL_ICI'  -- ⚠️ REMPLACEZ PAR VOTRE EMAIL
ORDER BY created_at;

-- 2. Vérifier dans public.profiles
SELECT 
  '👤 PROFILS DANS public.profiles' as info,
  id,
  email,
  full_name,
  created_at
FROM public.profiles
WHERE email = 'VOTRE_EMAIL_ICI'  -- ⚠️ REMPLACEZ PAR VOTRE EMAIL
ORDER BY created_at;

-- 3. Compter les comptes avec cet email
SELECT 
  '📊 STATISTIQUES' as info,
  COUNT(*) as nombre_comptes,
  STRING_AGG(DISTINCT COALESCE(raw_app_meta_data->>'provider', 'email/password'), ', ') as methodes_auth
FROM auth.users
WHERE email = 'VOTRE_EMAIL_ICI';  -- ⚠️ REMPLACEZ PAR VOTRE EMAIL
