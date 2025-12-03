-- ============================================
-- CORRECTION SIMPLE : Ajouter post_id à messages
-- ============================================
-- Script ultra-simple pour corriger l'erreur "column post_id does not exist"
-- Exécutez ce script dans votre SQL Editor Supabase

-- Vérifier et ajouter post_id
DO $$ 
BEGIN
  -- Vérifier si la colonne existe déjà
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'post_id'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE messages ADD COLUMN post_id UUID;
    
    -- Si la table posts existe, ajouter la référence
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'posts'
    ) THEN
      -- Ajouter la contrainte de référence
      ALTER TABLE messages 
      ADD CONSTRAINT messages_post_id_fkey 
      FOREIGN KEY (post_id) 
      REFERENCES posts(id) 
      ON DELETE SET NULL;
    END IF;
    
    RAISE NOTICE '✅ Colonne post_id ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne post_id existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND column_name = 'post_id';

