-- Script de vérification pour diagnostiquer les colonnes manquantes dans la table messages
-- Exécutez ce script pour voir quelles colonnes existent ou manquent

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Vérifier spécifiquement les colonnes nécessaires
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') 
    THEN 'EXISTS' ELSE 'MISSING' END as message_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id') 
    THEN 'EXISTS' ELSE 'MISSING' END as post_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url') 
    THEN 'EXISTS' ELSE 'MISSING' END as link_url,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') 
    THEN 'EXISTS' ELSE 'MISSING' END as reply_to_message_id;

