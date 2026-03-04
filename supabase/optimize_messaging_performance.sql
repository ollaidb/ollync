-- =========================================================
-- Optimisation messagerie : indexes et performances (safe)
-- Idempotent + tolérant si les tables de messagerie n'existent pas encore
-- =========================================================

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='messages'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc
      ON public.messages (conversation_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_messages_conv_unread
      ON public.messages (conversation_id, read_at)
      WHERE read_at IS NULL;
  ELSE
    RAISE NOTICE 'Skipping messages indexes: public.messages missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='conversations'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user1_last_msg
      ON public.conversations (user1_id, last_message_at DESC NULLS LAST);

    CREATE INDEX IF NOT EXISTS idx_conversations_user2_last_msg
      ON public.conversations (user2_id, last_message_at DESC NULLS LAST);

    CREATE INDEX IF NOT EXISTS idx_conversations_group_creator_last_msg
      ON public.conversations (group_creator_id, last_message_at DESC NULLS LAST)
      WHERE group_creator_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping conversations indexes: public.conversations missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='conversation_user_states'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conv_user_states_user_deleted
      ON public.conversation_user_states (user_id, deleted_at);
  ELSE
    RAISE NOTICE 'Skipping conversation_user_states index: table missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_conversation_summaries'
  ) THEN
    RAISE NOTICE 'RPC get_conversation_summaries missing: exécuter fix_app_stability_and_performance.sql';
  END IF;
END
$do$;
