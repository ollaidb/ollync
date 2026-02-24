-- ============================================
-- LIENS D'INVITATION POUR LES GROUPES
-- ============================================
-- Permet au créateur/admin de générer un lien partageable pour rejoindre le groupe.
-- Exécutez ce script dans le SQL Editor Supabase.

CREATE TABLE IF NOT EXISTS group_invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_conversation ON group_invite_tokens(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_token ON group_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_expires ON group_invite_tokens(expires_at);

ALTER TABLE group_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Lecture : token valide (pour rejoindre) OU membre du groupe
CREATE POLICY "group_invite_tokens_select" ON group_invite_tokens
  FOR SELECT USING (
    expires_at > NOW()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = group_invite_tokens.conversation_id
        AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Insertion : créateur ou admin du groupe
CREATE POLICY "group_invite_tokens_insert" ON group_invite_tokens
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = group_invite_tokens.conversation_id
        AND c.is_group = true
        AND (
          c.group_creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = auth.uid()
              AND cp2.is_active = true AND cp2.role = 'moderator'
          )
        )
    )
  );
