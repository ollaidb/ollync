-- ============================================
-- INSTALLATION COMPLÈTE DE LA MESSAGERIE
-- ============================================
-- Script simplifié et robuste pour créer toutes les tables de messagerie
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_group BOOLEAN DEFAULT false,
  group_name VARCHAR(255),
  group_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_post_id ON conversations(post_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- 2. TABLE MESSAGES
-- ============================================
-- Créer la table messages de base d'abord
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter toutes les colonnes manquantes une par une
DO $$ 
BEGIN
  -- message_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
  END IF;

  -- post_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'post_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
      ALTER TABLE messages ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE messages ADD COLUMN post_id UUID;
    END IF;
  END IF;

  -- link_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'link_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_url TEXT;
  END IF;

  -- link_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'link_title'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_title TEXT;
  END IF;

  -- link_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'link_description'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_description TEXT;
  END IF;

  -- link_image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'link_image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_image_url TEXT;
  END IF;

  -- reply_to_message_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'reply_to_message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;

  -- edited_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- deleted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- 3. TABLE CONVERSATION_PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

-- Index pour conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_active ON conversation_participants(is_active);

-- ============================================
-- 4. TABLE MESSAGE_READS
-- ============================================
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index pour message_reads
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

-- ============================================
-- 5. CONTRAINTES
-- ============================================
-- Contrainte pour message_type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_type 
      CHECK (message_type IN ('text', 'post', 'link'));
  END IF;
END $$;

-- Contrainte pour message_content (si toutes les colonnes existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_content') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
      (message_type = 'text' AND content IS NOT NULL) OR
      (message_type = 'post' AND post_id IS NOT NULL) OR
      (message_type = 'link' AND link_url IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================
-- 6. RLS (Row Level Security)
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join group conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own message reads" ON message_reads;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;

-- Politiques pour conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Politiques pour conversation_participants
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = conversations.id
              AND cp2.user_id = auth.uid()
              AND cp2.is_active = true
          )
        )
    )
  );

CREATE POLICY "Users can join group conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.is_group = true
    )
  );

CREATE POLICY "Users can leave groups" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
              AND user_id = auth.uid()
              AND is_active = true
          )
        )
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
              AND user_id = auth.uid()
              AND is_active = true
          )
        )
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Politiques pour message_reads
CREATE POLICY "Users can view their own message reads" ON message_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark messages as read" ON message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================
-- Fonction pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Fonction pour ajouter le créateur du groupe comme participant
CREATE OR REPLACE FUNCTION add_group_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_group = true AND NEW.group_creator_id IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id, is_active)
    VALUES (NEW.id, NEW.group_creator_id, true)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_group_creator_as_participant ON conversations;
CREATE TRIGGER trigger_add_group_creator_as_participant
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_participant();

-- ============================================
-- 8. VÉRIFICATION FINALE
-- ============================================
SELECT 
  'conversations' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
UNION ALL
SELECT 
  'conversation_participants' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversation_participants'
UNION ALL
SELECT 
  'message_reads' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message_reads';

-- Afficher les colonnes de messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Installation de la messagerie terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  - conversations';
  RAISE NOTICE '  - messages (avec post_id)';
  RAISE NOTICE '  - conversation_participants';
  RAISE NOTICE '  - message_reads';
  RAISE NOTICE '========================================';
END $$;

