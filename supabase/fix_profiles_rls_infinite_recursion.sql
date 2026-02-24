-- ============================================
-- CORRECTION : Récursion infinie sur la table profiles
-- ============================================
-- Erreur : "infinite recursion detected in policy for relation 'profiles'"
-- Cause : La politique "Moderator can view all profiles" fait un SELECT sur profiles
--         pour vérifier si l'utilisateur est modérateur, ce qui réévalue la même politique.
-- Solution : Utiliser une fonction SECURITY DEFINER qui lit profiles sans déclencher la RLS.
-- Exécutez ce script dans le SQL Editor Supabase.

-- 1. Créer une fonction qui vérifie si l'utilisateur connecté est le modérateur
--    (SECURITY DEFINER = s'exécute avec les droits du propriétaire, donc bypass RLS = pas de récursion)
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND lower(trim(email)) = 'binta22116@gmail.com'
  );
$$;

COMMENT ON FUNCTION public.is_moderator() IS 'Retourne true si l''utilisateur connecté est le compte modérateur (évite la récursion RLS sur profiles).';

-- 2. Supprimer l'ancienne politique qui provoquait la récursion
DROP POLICY IF EXISTS "Moderator can view all profiles" ON public.profiles;

-- 3. Recréer la politique en s'appuyant sur la fonction (plus de SELECT sur profiles dans la politique)
CREATE POLICY "Moderator can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.is_moderator());

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Correction appliquée : la politique profiles utilise maintenant is_moderator(). Plus de récursion.';
END $$;
