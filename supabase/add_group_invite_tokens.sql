-- ============================================
-- LIENS D'INVITATION POUR LES GROUPES (safe)
-- ============================================
-- Si les tables de messagerie ne sont pas encore créées,
-- ce script n'échoue plus : il affiche un NOTICE et s'arrête proprement.

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    RAISE NOTICE 'Table public.conversations absente. Exécutez d''abord create_messaging_tables.sql';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'Table public.profiles absente. Vérifiez votre schéma de base.';
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS public.group_invite_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_conversation ON public.group_invite_tokens(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_token ON public.group_invite_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_expires ON public.group_invite_tokens(expires_at);

  ALTER TABLE public.group_invite_tokens ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "group_invite_tokens_select" ON public.group_invite_tokens;
  CREATE POLICY "group_invite_tokens_select" ON public.group_invite_tokens
    FOR SELECT USING (
      expires_at > NOW()
      OR EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = group_invite_tokens.conversation_id
          AND cp.user_id = auth.uid() AND cp.is_active = true
      )
    );

  DROP POLICY IF EXISTS "group_invite_tokens_insert" ON public.group_invite_tokens;
  CREATE POLICY "group_invite_tokens_insert" ON public.group_invite_tokens
    FOR INSERT WITH CHECK (
      auth.uid() = created_by
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = group_invite_tokens.conversation_id
          AND c.is_group = true
          AND (
            c.group_creator_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.conversation_participants cp2
              WHERE cp2.conversation_id = c.id
                AND cp2.user_id = auth.uid()
                AND cp2.is_active = true
                AND cp2.role = 'moderator'
            )
          )
      )
    );
END
$do$;
