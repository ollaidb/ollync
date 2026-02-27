-- =========================================================
-- Optimisation messagerie : indexes et performances
-- Exécuter dans Supabase SQL Editor
-- Idempotent : peut être exécuté plusieurs fois
-- =========================================================

-- 1) Index composite pour le chargement paginé des messages
-- Utilisé par : WHERE conversation_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc
  ON public.messages (conversation_id, created_at DESC);

-- 2) Index pour les requêtes "messages non lus" par conversation
-- Utilisé par : WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
CREATE INDEX IF NOT EXISTS idx_messages_conv_unread
  ON public.messages (conversation_id, read_at)
  WHERE read_at IS NULL;

-- 3) Index pour les conversations : tri par last_message_at
-- (peut déjà exister via optimize_posts_messages_indexes.sql)
CREATE INDEX IF NOT EXISTS idx_conversations_user1_last_msg
  ON public.conversations (user1_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversations_user2_last_msg
  ON public.conversations (user2_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversations_group_creator_last_msg
  ON public.conversations (group_creator_id, last_message_at DESC NULLS LAST)
  WHERE group_creator_id IS NOT NULL;

-- 4) Index pour conversation_user_states (liste inbox filtrée)
CREATE INDEX IF NOT EXISTS idx_conv_user_states_user_deleted
  ON public.conversation_user_states (user_id, deleted_at);

-- 5) S'assurer que get_conversation_summaries existe (évite N+1)
-- Si déjà appliqué via fix_app_stability_and_performance.sql, aucune modification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_conversation_summaries'
  ) THEN
    RAISE NOTICE 'Exécutez supabase/fix_app_stability_and_performance.sql pour créer get_conversation_summaries';
  END IF;
END $$;
