-- ============================================
-- AJOUT DU STATUT 'completed' (réalisé) POUR LES POSTS
-- ============================================
-- Ce script ajoute le statut 'completed' à la table posts
-- et modifie les contraintes CHECK si nécessaire
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Supprimer toutes les contraintes CHECK existantes sur status
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Chercher et supprimer toutes les contraintes check sur status
  FOR constraint_record IN
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'posts'::regclass::oid
      AND contype = 'c'
      AND (
        conname LIKE '%status%' 
        OR pg_get_constraintdef(oid) LIKE '%status%'
      )
  LOOP
    EXECUTE format('ALTER TABLE posts DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    RAISE NOTICE '✅ Contrainte % supprimée', constraint_record.conname;
  END LOOP;
END $$;

-- 1b. Supprimer aussi les contraintes check_status spécifiquement
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_check_status;

-- 2. Ajouter une nouvelle contrainte CHECK qui accepte les statuts suivants :
--    - 'active' : Annonce en ligne
--    - 'archived' : Annonce archivée
--    - 'completed' : Annonce réalisée
--    - 'sold' : Annonce vendue (si déjà utilisé)
--    - 'pending' : En attente
DO $$
BEGIN
  -- Vérifier si une contrainte existe déjà
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'posts'::regclass::oid
      AND contype = 'c'
      AND (
        conname = 'posts_status_check' 
        OR conname = 'check_status'
        OR pg_get_constraintdef(oid) LIKE '%status%'
      )
  ) THEN
    RAISE NOTICE 'ℹ️  Des contraintes CHECK existent déjà, elles ont été supprimées à l''étape précédente';
  END IF;
  
  -- Ajouter la nouvelle contrainte
  ALTER TABLE posts 
  ADD CONSTRAINT posts_status_check 
  CHECK (status IN ('active', 'archived', 'completed', 'sold', 'pending'));
  
  RAISE NOTICE '✅ Contrainte CHECK créée avec les statuts: active, archived, completed, sold, pending';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  Contrainte posts_status_check existe déjà, tentative de modification...';
    -- Si elle existe mais avec des valeurs différentes, on la supprime et la recrée
    BEGIN
      ALTER TABLE posts DROP CONSTRAINT posts_status_check;
      ALTER TABLE posts 
      ADD CONSTRAINT posts_status_check 
      CHECK (status IN ('active', 'archived', 'completed', 'sold', 'pending'));
      RAISE NOTICE '✅ Contrainte CHECK mise à jour';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Erreur lors de la modification de la contrainte: %', SQLERRM;
    END;
END $$;

-- 3. Vérification - Afficher les statuts possibles
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
  AND column_name = 'status';

-- 4. Afficher la contrainte actuelle
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'posts'::regclass
  AND contype = 'c'
  AND conname LIKE '%status%';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MISE À JOUR TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Statuts acceptés pour les posts :';
  RAISE NOTICE '  - active : Annonce en ligne (visible publiquement)';
  RAISE NOTICE '  - archived : Annonce archivée (visible uniquement par l''utilisateur)';
  RAISE NOTICE '  - completed : Annonce réalisée (visible uniquement par l''utilisateur)';
  RAISE NOTICE '  - sold : Annonce vendue (si applicable)';
  RAISE NOTICE '  - pending : En attente';
  RAISE NOTICE '';
  RAISE NOTICE 'Les annonces avec status "archived" ou "completed" ne sont';
  RAISE NOTICE 'pas visibles dans le feed public, seulement dans la page';
  RAISE NOTICE 'personnelle de l''utilisateur.';
  RAISE NOTICE '';
END $$;

