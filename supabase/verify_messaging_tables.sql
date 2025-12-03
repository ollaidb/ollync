-- ============================================
-- VÉRIFICATION DES TABLES DE MESSAGERIE
-- ============================================
-- Ce script vérifie si toutes les tables de messagerie sont en place
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Vérifier la table conversations
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations')
    THEN '✅ Table conversations existe'
    ELSE '❌ Table conversations MANQUANTE'
  END as conversations_status;

-- 2. Vérifier les colonnes de conversations
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. Vérifier la table messages
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
    THEN '✅ Table messages existe'
    ELSE '❌ Table messages MANQUANTE'
  END as messages_status;

-- 4. Vérifier les colonnes de messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 5. Vérifier la table conversation_participants
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants')
    THEN '✅ Table conversation_participants existe'
    ELSE '❌ Table conversation_participants MANQUANTE'
  END as conversation_participants_status;

-- 6. Vérifier la table message_reads
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_reads')
    THEN '✅ Table message_reads existe'
    ELSE '❌ Table message_reads MANQUANTE'
  END as message_reads_status;

-- 7. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'conversation_participants', 'message_reads')
ORDER BY tablename, policyname;

-- 8. Résumé des tables
SELECT 
  'conversations' as table_name,
  COUNT(*) as row_count
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as row_count
FROM messages
UNION ALL
SELECT 
  'conversation_participants' as table_name,
  COUNT(*) as row_count
FROM conversation_participants
UNION ALL
SELECT 
  'message_reads' as table_name,
  COUNT(*) as row_count
FROM message_reads;

-- 9. Message final
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Si des tables sont manquantes, exécutez:';
  RAISE NOTICE '  supabase/create_messaging_tables.sql';
  RAISE NOTICE '========================================';
END $$;

