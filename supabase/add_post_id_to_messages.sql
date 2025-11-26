-- Script simple pour ajouter la colonne post_id à la table messages
-- Ce script vérifie d'abord si la table posts existe

-- Vérifier si la table posts existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) THEN
    RAISE EXCEPTION 'La table posts n''existe pas. Veuillez d''abord exécuter le script schema.sql pour créer toutes les tables de base.';
  END IF;
END $$;

-- Vérifier si la colonne post_id existe déjà et l'ajouter si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'post_id'
  ) THEN
    RAISE NOTICE 'La colonne post_id existe déjà dans la table messages';
  ELSE
    -- Ajouter la colonne post_id (sans contrainte d'abord)
    ALTER TABLE messages ADD COLUMN post_id UUID;
    RAISE NOTICE 'Colonne post_id ajoutée';
    
    -- Ajouter la contrainte de clé étrangère après avoir ajouté la colonne
    BEGIN
      ALTER TABLE messages 
        ADD CONSTRAINT messages_post_id_fkey 
        FOREIGN KEY (post_id) 
        REFERENCES posts(id) 
        ON DELETE SET NULL;
      RAISE NOTICE 'Contrainte de clé étrangère ajoutée';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'La contrainte existe déjà';
      WHEN OTHERS THEN
        RAISE WARNING 'Erreur lors de l''ajout de la contrainte: %', SQLERRM;
    END;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur: %', SQLERRM;
END $$;

-- Vérifier le résultat
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages' 
  AND column_name = 'post_id';

