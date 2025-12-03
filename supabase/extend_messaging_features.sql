-- ============================================
-- EXTENSION DES FONCTIONNALITÉS DE MESSAGERIE
-- ============================================
-- Ce script ajoute toutes les fonctionnalités avancées de messagerie
-- Exécutez ce script dans votre SQL Editor Supabase

-- ============================================
-- 1. EXTENSION DE LA TABLE MESSAGES
-- ============================================

-- Ajouter les colonnes pour les types de messages avancés
DO $$ 
BEGIN
  -- message_type: 'text', 'photo', 'video', 'document', 'post_share', 'profile_share', 'location', 'price', 'rate', 'calendar_request'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
  END IF;

  -- file_url: pour les photos, vidéos, documents
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'file_url') THEN
    ALTER TABLE messages ADD COLUMN file_url TEXT;
  END IF;

  -- file_name: nom du fichier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'file_name') THEN
    ALTER TABLE messages ADD COLUMN file_name VARCHAR(255);
  END IF;

  -- file_size: taille du fichier en bytes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'file_size') THEN
    ALTER TABLE messages ADD COLUMN file_size BIGINT;
  END IF;

  -- file_type: MIME type (image/jpeg, video/mp4, application/pdf, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'file_type') THEN
    ALTER TABLE messages ADD COLUMN file_type VARCHAR(100);
  END IF;

  -- shared_post_id: pour partager une annonce
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'shared_post_id') THEN
    ALTER TABLE messages ADD COLUMN shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
  END IF;

  -- shared_profile_id: pour partager un profil
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'shared_profile_id') THEN
    ALTER TABLE messages ADD COLUMN shared_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- location_data: JSONB pour stocker les données de localisation {lat, lng, address}
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'location_data') THEN
    ALTER TABLE messages ADD COLUMN location_data JSONB;
  END IF;

  -- price_data: JSONB pour stocker les données de prix {amount, currency, type: 'offer'|'request'}
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'price_data') THEN
    ALTER TABLE messages ADD COLUMN price_data JSONB;
  END IF;

  -- rate_data: JSONB pour stocker les données de tarif {amount, currency, period: 'hour'|'day'|'project'}
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'rate_data') THEN
    ALTER TABLE messages ADD COLUMN rate_data JSONB;
  END IF;

  -- calendar_request_data: JSONB pour stocker les données de demande calendrier {event_name, start_date, end_date, description}
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'calendar_request_data') THEN
    ALTER TABLE messages ADD COLUMN calendar_request_data JSONB;
  END IF;

  -- is_deleted: pour la suppression soft (message supprimé pour l'utilisateur)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'is_deleted') THEN
    ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;

  -- deleted_for_user_id: pour savoir pour quel utilisateur le message est supprimé
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'deleted_for_user_id') THEN
    ALTER TABLE messages ADD COLUMN deleted_for_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- reply_to_message_id: pour les réponses à un message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_shared_post_id ON messages(shared_post_id);
CREATE INDEX IF NOT EXISTS idx_messages_shared_profile_id ON messages(shared_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);

-- ============================================
-- 2. TABLE DES LIKES DE MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS message_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON message_likes(user_id);

-- ============================================
-- 3. TABLE DES SIGNALEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter_id ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);

-- ============================================
-- 4. TABLE DES BLOCAGES
-- ============================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);

-- ============================================
-- 5. TABLE DES PRÉFÉRENCES DE CONVERSATION
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_preferences_conversation_id ON conversation_preferences(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_user_id ON conversation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_is_archived ON conversation_preferences(is_archived);

-- ============================================
-- 6. EXTENSION DE LA TABLE CONVERSATIONS POUR LES GROUPES
-- ============================================

DO $$ 
BEGIN
  -- group_photo_url: photo de groupe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'group_photo_url') THEN
    ALTER TABLE conversations ADD COLUMN group_photo_url TEXT;
  END IF;

  -- is_archived: pour archiver une conversation (global, pas par utilisateur)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'is_archived') THEN
    ALTER TABLE conversations ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 7. TABLE DES MATCHS (pour l'onglet Matchs)
-- ============================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Politiques pour message_likes
DROP POLICY IF EXISTS "Users can view likes on messages in their conversations" ON message_likes;
DROP POLICY IF EXISTS "Users can like messages in their conversations" ON message_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON message_likes;

CREATE POLICY "Users can view likes on messages in their conversations" ON message_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_likes.message_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can like messages in their conversations" ON message_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_likes.message_id
        AND (
          conversations.user1_id = auth.uid() OR
          conversations.user2_id = auth.uid() OR
          conversations.group_creator_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can unlike their own likes" ON message_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour message_reports
DROP POLICY IF EXISTS "Users can report messages" ON message_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON message_reports;

CREATE POLICY "Users can report messages" ON message_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON message_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Politiques pour user_blocks
DROP POLICY IF EXISTS "Users can block other users" ON user_blocks;
DROP POLICY IF EXISTS "Users can view their own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can unblock" ON user_blocks;

CREATE POLICY "Users can block other users" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their own blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Politiques pour conversation_preferences
DROP POLICY IF EXISTS "Users can manage their conversation preferences" ON conversation_preferences;

CREATE POLICY "Users can manage their conversation preferences" ON conversation_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Politiques pour matches
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update their matches" ON matches;

CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- 9. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir le nombre de likes d'un message
CREATE OR REPLACE FUNCTION get_message_likes_count(message_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM message_likes
    WHERE message_id = message_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a liké un message
CREATE OR REPLACE FUNCTION has_user_liked_message(message_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM message_likes
    WHERE message_id = message_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VÉRIFICATION
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Extension des fonctionnalités de messagerie terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nouvelles fonctionnalités ajoutées:';
  RAISE NOTICE '  - Types de messages avancés (photos, vidéos, documents, etc.)';
  RAISE NOTICE '  - Partage d''annonces et profils';
  RAISE NOTICE '  - Localisation, prix, tarifs, demandes calendrier';
  RAISE NOTICE '  - Likes sur les messages';
  RAISE NOTICE '  - Signalements de messages';
  RAISE NOTICE '  - Blocage d''utilisateurs';
  RAISE NOTICE '  - Préférences de conversation (notifications, archivage)';
  RAISE NOTICE '  - Support des groupes (nom, photo)';
  RAISE NOTICE '  - Système de matchs';
  RAISE NOTICE '========================================';
END $$;

