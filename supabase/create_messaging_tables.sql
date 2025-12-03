-- ============================================
-- CRÉATION DES TABLES DE MESSAGERIE
-- ============================================
-- Système de messagerie complet avec groupes, réponses, et différents types de messages
-- Exécutez ce script dans votre SQL Editor Supabase

-- Extension pour générer des UUIDs (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE DES CONVERSATIONS
-- ============================================
-- Supporte les conversations individuelles et les groupes (jusqu'à 10 personnes)

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  -- Pour les conversations individuelles
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- Métadonnées
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes pour les groupes si elles n'existent pas
DO $$ 
BEGIN
  -- Ajouter is_group si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'is_group') THEN
    ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT false;
  END IF;

  -- Ajouter group_name si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'group_name') THEN
    ALTER TABLE conversations ADD COLUMN group_name VARCHAR(255);
  END IF;

  -- Ajouter group_creator_id si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'group_creator_id') THEN
    ALTER TABLE conversations ADD COLUMN group_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Ajouter updated_at si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Ajouter la contrainte si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_conversation_type'
  ) THEN
    ALTER TABLE conversations ADD CONSTRAINT check_conversation_type CHECK (
      (is_group = false AND user1_id IS NOT NULL AND user2_id IS NOT NULL) OR
      (is_group = true)
    );
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_group_creator_id ON conversations(group_creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON conversations(is_group);
CREATE INDEX IF NOT EXISTS idx_conversations_post_id ON conversations(post_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- 2. TABLE DES PARTICIPANTS AUX CONVERSATIONS
-- ============================================
-- Pour les groupes : liste des participants (maximum 10 par groupe)

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
  -- Ajouter left_at si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversation_participants' AND column_name = 'left_at') THEN
    ALTER TABLE conversation_participants ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Ajouter is_active si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversation_participants' AND column_name = 'is_active') THEN
    ALTER TABLE conversation_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_active ON conversation_participants(is_active);

-- Fonction pour vérifier qu'un groupe ne dépasse pas 10 participants
CREATE OR REPLACE FUNCTION check_group_participants_limit()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INTEGER;
  is_group_conversation BOOLEAN;
BEGIN
  -- Vérifier si c'est une conversation de groupe
  SELECT is_group INTO is_group_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF is_group_conversation THEN
    -- Compter les participants actifs
    SELECT COUNT(*) INTO participant_count
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND is_active = true;

    -- Si on ajoute un nouveau participant et qu'on dépasse 10, refuser
    IF NEW.is_active = true AND participant_count >= 10 THEN
      RAISE EXCEPTION 'Un groupe ne peut pas avoir plus de 10 participants';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier la limite de 10 participants
DROP TRIGGER IF EXISTS trigger_check_group_participants_limit ON conversation_participants;
CREATE TRIGGER trigger_check_group_participants_limit
  BEFORE INSERT OR UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_group_participants_limit();

-- ============================================
-- 3. TABLE DES MESSAGES
-- ============================================
-- Supporte les textes, annonces, liens, et réponses aux messages

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si elles n'existent pas
-- Utiliser des commandes ALTER TABLE séparées pour éviter les problèmes de transaction

-- Ajouter message_type si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'messages' 
      AND column_name = 'message_type'
  ) THEN
    EXECUTE 'ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT ''text''';
  END IF;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
  WHEN OTHERS THEN
    RAISE;
END $$;

-- Ajouter la contrainte check_message_type si elle n'existe pas (après avoir ajouté la colonne)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'message_type')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_type 
      CHECK (message_type IN ('text', 'post', 'link'));
  END IF;
END $$;

-- Ajouter post_id si elle n'existe pas
-- Utiliser une approche plus directe pour éviter les problèmes
DO $$ 
BEGIN
  -- Vérifier et ajouter post_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'messages' 
      AND column_name = 'post_id'
  ) THEN
    EXECUTE 'ALTER TABLE messages ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL';
  END IF;
EXCEPTION
  WHEN duplicate_column THEN
    -- La colonne existe déjà, ignorer
    NULL;
  WHEN OTHERS THEN
    -- Autre erreur, la propager
    RAISE;
END $$;

-- Ajouter link_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'link_url') THEN
    ALTER TABLE messages ADD COLUMN link_url TEXT;
  END IF;
END $$;

-- Ajouter link_title si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'link_title') THEN
    ALTER TABLE messages ADD COLUMN link_title TEXT;
  END IF;
END $$;

-- Ajouter link_description si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'link_description') THEN
    ALTER TABLE messages ADD COLUMN link_description TEXT;
  END IF;
END $$;

-- Ajouter link_image_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'link_image_url') THEN
    ALTER TABLE messages ADD COLUMN link_image_url TEXT;
  END IF;
END $$;

-- Ajouter reply_to_message_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter edited_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'edited_at') THEN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Ajouter deleted_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Modifier content pour permettre NULL (car les messages de type post/link peuvent ne pas avoir de content)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'content' AND is_nullable = 'NO') THEN
    ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- Ajouter la contrainte check_message_content si elle n'existe pas
-- Note: Cette contrainte nécessite que toutes les colonnes existent
DO $$
BEGIN
  -- Vérifier que toutes les colonnes nécessaires existent avant d'ajouter la contrainte
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'check_message_content'
     ) THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
      (message_type = 'text' AND content IS NOT NULL) OR
      (message_type = 'post' AND post_id IS NOT NULL) OR
      (message_type = 'link' AND link_url IS NOT NULL)
    );
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Créer les index conditionnellement si les colonnes existent
DO $$
BEGIN
  -- Index pour reply_to_message_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id);
  END IF;

  -- Index pour post_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'post_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id);
  END IF;

  -- Index pour message_type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
  END IF;

  -- Index pour deleted_at
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- ============================================
-- 4. TABLE DES LECTURES DE MESSAGES (pour les groupes)
-- ============================================
-- Pour suivre quels messages ont été lus par quels utilisateurs dans les groupes

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES POUR LES CONVERSATIONS
-- ============================================
-- Les utilisateurs peuvent voir leurs conversations
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

-- Les utilisateurs peuvent créer des conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- Les utilisateurs peuvent mettre à jour leurs conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id OR 
    auth.uid() = group_creator_id
  );

-- ============================================
-- POLICIES POUR LES PARTICIPANTS
-- ============================================
-- Les utilisateurs peuvent voir les participants de leurs conversations
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

-- Les utilisateurs peuvent s'ajouter aux conversations de groupe
CREATE POLICY "Users can join group conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.is_group = true
    )
  );

-- Les utilisateurs peuvent quitter les groupes
CREATE POLICY "Users can leave groups" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES POUR LES MESSAGES
-- ============================================
-- Les utilisateurs peuvent voir les messages de leurs conversations
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

-- Les utilisateurs peuvent envoyer des messages dans leurs conversations
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

-- Les utilisateurs peuvent modifier leurs propres messages
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================
-- POLICIES POUR LES LECTURES DE MESSAGES
-- ============================================
-- Les utilisateurs peuvent voir leurs propres lectures
CREATE POLICY "Users can view their own message reads" ON message_reads
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent marquer des messages comme lus
CREATE POLICY "Users can mark messages as read" ON message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS ET FONCTIONS
-- ============================================

-- Fonction pour mettre à jour last_message_at quand un nouveau message est créé
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

-- Trigger pour mettre à jour last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Fonction pour ajouter automatiquement le créateur d'un groupe comme participant
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

-- Trigger pour ajouter le créateur du groupe comme participant
DROP TRIGGER IF EXISTS trigger_add_group_creator_as_participant ON conversations;
CREATE TRIGGER trigger_add_group_creator_as_participant
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_participant();

