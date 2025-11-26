-- Script pour créer les tables manquantes: conversations et conversation_participants
-- Exécutez ce script dans le SQL Editor de Supabase

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes pour les groupes si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'is_group') THEN
    ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'group_name') THEN
    ALTER TABLE conversations ADD COLUMN group_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'group_creator_id') THEN
    ALTER TABLE conversations ADD COLUMN group_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Ajouter les colonnes manquantes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversation_participants' AND column_name = 'left_at') THEN
    ALTER TABLE conversation_participants ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversation_participants' AND column_name = 'is_active') THEN
    ALTER TABLE conversation_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_post_id ON conversations(post_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Policies pour conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND COALESCE(is_active, true) = true
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Policies pour conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
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
              AND COALESCE(cp2.is_active, true) = true
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can join group conversations" ON conversation_participants;
CREATE POLICY "Users can join group conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND COALESCE(conversations.is_group, false) = true
    )
  );

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
  IF COALESCE(NEW.is_group, false) = true AND NEW.group_creator_id IS NOT NULL THEN
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

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Tables conversations et conversation_participants créées avec succès!';
END $$;

