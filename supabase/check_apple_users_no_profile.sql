-- ============================================
-- VÉRIFICATION RAPIDE : Utilisateurs Apple SANS Profil
-- ============================================
-- Cette requête répond directement : Y a-t-il des utilisateurs Apple sans profil ?

SELECT 
  '❌ UTILISATEURS APPLE SANS PROFIL' as probleme,
  COUNT(*) as nombre_utilisateurs_sans_profil,
  STRING_AGG(au.email, ', ') as emails_utilisateurs_sans_profil
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.raw_app_meta_data->>'provider' = 'apple'
  AND p.id IS NULL;
