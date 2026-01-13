-- ============================================
-- NETTOYAGE DES TABLES NON UTILISÉES
-- ============================================
-- Ce script supprime les tables qui ne sont pas utilisées dans le code
-- ATTENTION : Exécutez d'abord ANALYSE_TABLES_COMPLETE.md pour vérifier
-- ATTENTION : Faites un backup avant d'exécuter ce script en production
-- ============================================

-- ============================================
-- 1. SUPPRESSION DES TABLES DE RECOMMANDATION REDONDANTES
-- ============================================
-- Ces tables ne sont pas utilisées dans le code et seront remplacées par une seule table

-- Supprimer user_recommendations (ancienne version complexe)
DROP TABLE IF EXISTS user_recommendations CASCADE;

-- Supprimer recommendation_history
DROP TABLE IF EXISTS recommendation_history CASCADE;

-- Supprimer recommendation_rules
DROP TABLE IF EXISTS recommendation_rules CASCADE;

-- Supprimer user_algorithm_preferences
DROP TABLE IF EXISTS user_algorithm_preferences CASCADE;

-- ============================================
-- 2. SUPPRESSION DES TABLES NON UTILISÉES
-- ============================================

-- Supprimer search_history (créée mais jamais utilisée)
DROP TABLE IF EXISTS search_history CASCADE;

-- Supprimer shares (définie dans schema mais pas utilisée)
DROP TABLE IF EXISTS shares CASCADE;

-- Supprimer user_settings (définie mais pas utilisée)
DROP TABLE IF EXISTS user_settings CASCADE;

-- Supprimer post_views (les vues sont trackées dans posts.views_count)
DROP TABLE IF EXISTS post_views CASCADE;

-- Supprimer tags (fonctionnalité non implémentée)
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Supprimer transactions (fonctionnalité non implémentée)
DROP TABLE IF EXISTS transactions CASCADE;

-- ============================================
-- 3. MESSAGES DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Tables non utilisées supprimées avec succès!';
  RAISE NOTICE 'Tables supprimées:';
  RAISE NOTICE '  - user_recommendations (ancienne version)';
  RAISE NOTICE '  - recommendation_history';
  RAISE NOTICE '  - recommendation_rules';
  RAISE NOTICE '  - user_algorithm_preferences';
  RAISE NOTICE '  - search_history';
  RAISE NOTICE '  - shares';
  RAISE NOTICE '  - user_settings';
  RAISE NOTICE '  - post_views';
  RAISE NOTICE '  - tags et post_tags';
  RAISE NOTICE '  - transactions';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: Exécutez create_user_recommendations_table.sql pour créer la nouvelle table simplifiée';
END $$;
