-- ============================================
-- SCRIPT DE VÉRIFICATION - SYSTÈME DE NOTIFICATIONS
-- ============================================
-- Ce script vérifie que toutes les composantes du système de notifications
-- sont correctement installées et fonctionnelles
-- ============================================

-- ============================================
-- VÉRIFICATION 1 : COLONNES DE LA TABLE
-- ============================================
DO $$
DECLARE
  missing_columns TEXT[] := '{}';
  required_columns TEXT[] := ARRAY['id', 'user_id', 'type', 'title', 'content', 'related_id', 'read', 'created_at', 'sender_id', 'group_key', 'metadata'];
  col TEXT;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES COLONNES ===';
  
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ Toutes les colonnes requises existent';
  ELSE
    RAISE WARNING '❌ Colonnes manquantes: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 2 : INDEX
-- ============================================
DO $$
DECLARE
  index_count INTEGER;
  required_indexes TEXT[] := ARRAY[
    'idx_notifications_sender_id',
    'idx_notifications_group_key',
    'idx_notifications_user_group',
    'idx_notifications_user_created',
    'idx_notifications_user_read',
    'idx_notifications_type'
  ];
  idx TEXT;
  missing_indexes TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES INDEX ===';
  
  FOREACH idx IN ARRAY required_indexes
  LOOP
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'notifications' AND indexname = idx;
    
    IF index_count = 0 THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✅ Tous les index de base existent';
  ELSE
    RAISE WARNING '⚠️ Index manquants: %', array_to_string(missing_indexes, ', ');
    RAISE NOTICE '💡 Exécutez optimize_notifications_filters.sql pour ajouter les index d''optimisation';
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 3 : FONCTIONS
-- ============================================
DO $$
DECLARE
  func_count INTEGER;
  required_functions TEXT[] := ARRAY[
    'create_or_update_notification',
    'create_notification',
    'get_notification_counts'
  ];
  func TEXT;
  missing_functions TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES FONCTIONS ===';
  
  FOREACH func IN ARRAY required_functions
  LOOP
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = func;
    
    IF func_count = 0 THEN
      missing_functions := array_append(missing_functions, func);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) IS NULL THEN
    RAISE NOTICE '✅ Toutes les fonctions requises existent';
  ELSE
    RAISE WARNING '❌ Fonctions manquantes: %', array_to_string(missing_functions, ', ');
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 4 : TRIGGERS
-- ============================================
DO $$
DECLARE
  trigger_count INTEGER;
  required_triggers TEXT[] := ARRAY[
    'trigger_notify_on_like',
    'trigger_notify_on_comment',
    'trigger_notify_on_message',
    'trigger_notify_new_post',
    'trigger_notify_match_request_sent',
    'trigger_notify_match_request_received',
    'trigger_notify_match_request_accepted',
    'trigger_notify_match_request_declined'
  ];
  trig TEXT;
  missing_triggers TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES TRIGGERS ===';
  
  FOREACH trig IN ARRAY required_triggers
  LOOP
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND trigger_name = trig;
    
    IF trigger_count = 0 THEN
      missing_triggers := array_append(missing_triggers, trig);
    END IF;
  END LOOP;
  
  IF array_length(missing_triggers, 1) IS NULL THEN
    RAISE NOTICE '✅ Tous les triggers principaux existent';
  ELSE
    RAISE WARNING '⚠️ Triggers manquants: %', array_to_string(missing_triggers, ', ');
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 5 : STATISTIQUES DE LA TABLE
-- ============================================
DO $$
DECLARE
  notification_count BIGINT;
  unread_count BIGINT;
  type_distribution RECORD;
BEGIN
  RAISE NOTICE '=== STATISTIQUES DE LA TABLE ===';
  
  SELECT COUNT(*) INTO notification_count FROM notifications;
  SELECT COUNT(*) INTO unread_count FROM notifications WHERE read = false;
  
  RAISE NOTICE 'Total de notifications: %', notification_count;
  RAISE NOTICE 'Notifications non lues: %', unread_count;
  
  IF notification_count > 0 THEN
    RAISE NOTICE '--- Distribution par type ---';
    FOR type_distribution IN
      SELECT type, COUNT(*) as count, COUNT(*) FILTER (WHERE read = false) as unread
      FROM notifications
      GROUP BY type
      ORDER BY count DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '  %: % total (% non lues)', 
        type_distribution.type, 
        type_distribution.count, 
        type_distribution.unread;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 6 : TEST DE LA FONCTION DE STATISTIQUES
-- ============================================
DO $$
DECLARE
  test_user_id UUID;
  stats RECORD;
BEGIN
  RAISE NOTICE '=== TEST DE LA FONCTION get_notification_counts ===';
  
  -- Trouver un utilisateur avec des notifications pour tester
  SELECT user_id INTO test_user_id
  FROM notifications
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Test avec l''utilisateur: %', test_user_id;
    
    FOR stats IN
      SELECT * FROM get_notification_counts(test_user_id)
    LOOP
      RAISE NOTICE '  Filtre "%": % notifications', stats.filter_type, stats.count;
    END LOOP;
    
    RAISE NOTICE '✅ La fonction get_notification_counts fonctionne correctement';
  ELSE
    RAISE NOTICE '⚠️ Aucune notification trouvée pour tester la fonction';
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 7 : PERMISSIONS RLS
-- ============================================
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES PERMISSIONS RLS ===';
  
  SELECT tablename, rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'notifications';
  
  -- Note: RLS peut être activé ou désactivé selon votre configuration
  RAISE NOTICE 'RLS sur notifications: %', 
    CASE WHEN rls_enabled THEN 'Activé' ELSE 'Désactivé' END;
  
  RAISE NOTICE '💡 Assurez-vous que les politiques RLS permettent aux utilisateurs de lire leurs propres notifications';
END $$;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Si toutes les vérifications sont passées, votre système de notifications est prêt !';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes :';
  RAISE NOTICE '   1. Exécutez optimize_notifications_filters.sql pour optimiser les performances';
  RAISE NOTICE '   2. Testez les filtres dans l''interface utilisateur';
  RAISE NOTICE '   3. Vérifiez que les notifications s''affichent correctement';
  RAISE NOTICE '';
END $$;

