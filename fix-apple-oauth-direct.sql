-- Script SQL pour vérifier et corriger les problèmes OAuth Apple
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier si des utilisateurs Apple existent (même en erreur)
SELECT 
  'Utilisateurs Apple existants' as info,
  COUNT(*) as nombre
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'apple';

-- 2. Vérifier les profils Apple
SELECT 
  'Profils Apple existants' as info,
  COUNT(*) as nombre
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE au.raw_app_meta_data->>'provider' = 'apple';

-- 3. Vérifier le trigger
SELECT 
  'Trigger existe' as info,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OUI'
    ELSE 'NON'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
