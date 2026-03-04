-- =========================================================
-- App Stability + Performance Patch (idempotent + safe)
-- =========================================================

BEGIN;

-- 1) Profiles hardening
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS data_consent jsonb DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS data_consent_enabled boolean DEFAULT true;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_profiles_data_consent_gin ON public.profiles USING gin (data_consent);
  END IF;
END
$do$;

-- 2) Views (only if base tables exist)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    EXECUTE $sql$
      DROP VIEW IF EXISTS public.public_messages_with_sender;
      CREATE VIEW public.public_messages_with_sender AS
      SELECT
        m.*,
        jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        ) AS sender
      FROM public.messages m
      LEFT JOIN public.profiles p ON p.id = m.sender_id;
      GRANT SELECT ON public.public_messages_with_sender TO anon, authenticated;
    $sql$;
  ELSE
    RAISE NOTICE 'Skipping public_messages_with_sender (messages/profiles missing)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    EXECUTE $sql$
      DROP VIEW IF EXISTS public.public_conversations_with_users;
      CREATE VIEW public.public_conversations_with_users AS
      SELECT
        c.*,
        jsonb_build_object('id', u1.id, 'username', u1.username, 'full_name', u1.full_name, 'avatar_url', u1.avatar_url) AS user1,
        jsonb_build_object('id', u2.id, 'username', u2.username, 'full_name', u2.full_name, 'avatar_url', u2.avatar_url) AS user2
      FROM public.conversations c
      LEFT JOIN public.profiles u1 ON u1.id = c.user1_id
      LEFT JOIN public.profiles u2 ON u2.id = c.user2_id;
      GRANT SELECT ON public.public_conversations_with_users TO anon, authenticated;
    $sql$;
  ELSE
    RAISE NOTICE 'Skipping public_conversations_with_users (conversations/profiles missing)';
  END IF;
END
$do$;

-- 3) RPCs (only if required tables exist)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.get_conversation_summaries(
        conversation_ids uuid[],
        viewer_id uuid
      )
      RETURNS TABLE (
        conversation_id uuid,
        last_message_content text,
        last_message_created_at timestamptz,
        last_message_sender_id uuid,
        last_message_type text,
        unread_count integer
      )
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
        WITH last_messages AS (
          SELECT DISTINCT ON (m.conversation_id)
            m.conversation_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.message_type
          FROM public.messages m
          WHERE m.conversation_id = ANY (conversation_ids)
          ORDER BY m.conversation_id, m.created_at DESC
        ),
        unread_counts AS (
          SELECT
            m.conversation_id,
            COUNT(*)::int AS unread_count
          FROM public.messages m
          WHERE m.conversation_id = ANY (conversation_ids)
            AND m.read_at IS NULL
            AND m.sender_id IS DISTINCT FROM viewer_id
          GROUP BY m.conversation_id
        )
        SELECT
          lm.conversation_id,
          lm.content AS last_message_content,
          lm.created_at AS last_message_created_at,
          lm.sender_id AS last_message_sender_id,
          lm.message_type AS last_message_type,
          COALESCE(uc.unread_count, 0) AS unread_count
        FROM last_messages lm
        LEFT JOIN unread_counts uc ON uc.conversation_id = lm.conversation_id;
      $func$;
      GRANT EXECUTE ON FUNCTION public.get_conversation_summaries(uuid[], uuid) TO authenticated;
    $sql$;
  ELSE
    RAISE NOTICE 'Skipping get_conversation_summaries (messages missing)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversation_participants') THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(p_conversation_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM public.conversations c
          WHERE c.id = p_conversation_id
            AND (
              c.user1_id = auth.uid()
              OR c.user2_id = auth.uid()
              OR c.group_creator_id = auth.uid()
              OR EXISTS (
                SELECT 1
                FROM public.conversation_participants cp
                WHERE cp.conversation_id = c.id
                  AND cp.user_id = auth.uid()
                  AND COALESCE(cp.is_active, true) = true
              )
            )
        ) THEN
          RAISE EXCEPTION 'Not allowed';
        END IF;

        UPDATE public.messages
        SET read_at = now()
        WHERE conversation_id = p_conversation_id
          AND sender_id IS DISTINCT FROM auth.uid()
          AND read_at IS NULL;
      END;
      $func$;
      GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(uuid) TO authenticated;
    $sql$;
  ELSE
    RAISE NOTICE 'Skipping mark_conversation_messages_read (messages/conversations/participants missing)';
  END IF;
END
$do$;

-- 4) indexes
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread ON public.messages(conversation_id, read_at, sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at ON public.messages(sender_id, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversations') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user1_deleted ON public.conversations(user1_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_conversations_user2_deleted ON public.conversations(user2_id, deleted_at);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_match_requests_to_status ON public.match_requests(to_user_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_match_requests_from_status ON public.match_requests(from_user_id, status, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
    CREATE INDEX IF NOT EXISTS idx_appointments_user_datetime ON public.appointments(recipient_id, appointment_datetime DESC);
    CREATE INDEX IF NOT EXISTS idx_appointments_sender_datetime ON public.appointments(sender_id, appointment_datetime DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
  END IF;
END
$do$;

COMMIT;
