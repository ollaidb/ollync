-- Script de vérification pour voir quelles tables existent
-- Exécutez ce script pour diagnostiquer le problème

-- Vérifier si la table posts existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts')
    THEN 'EXISTS' 
    ELSE 'MISSING - Vous devez créer la table posts d''abord!' 
  END as posts_table_status;

-- Vérifier si la table messages existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as messages_table_status;

-- Vérifier les colonnes de la table messages
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- Vérifier spécifiquement si post_id existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'post_id'
    )
    THEN 'EXISTS' 
    ELSE 'MISSING - La colonne post_id n''existe pas!' 
  END as post_id_column_status;

