-- ============================================
-- CORRECTION : erreur "array_agg is an aggregate function" sur profiles
-- ============================================
-- Une politique RLS sur la table profiles utilise array_agg de façon invalide.
-- Ce script supprime toutes les politiques sur profiles (sans utiliser la vue
-- pg_policies qui déclenche l'erreur) puis les recrée correctement.

-- 1) Supprimer toutes les politiques sur profiles (lecture des noms via pg_policy uniquement)
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  FOR pol_record IN
    SELECT pol.polname
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol_record.polname);
    RAISE NOTICE 'Politique supprimée sur profiles : %', pol_record.polname;
  END LOOP;
END
$$;

-- 2) Recréer des politiques simples (sans array_agg ni agrégat)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Pas de DELETE sur profiles par défaut (les comptes se suppriment via auth).
-- Si vous en aviez une, recréez-la ici si besoin.
