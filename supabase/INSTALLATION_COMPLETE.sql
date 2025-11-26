-- ============================================
-- SCRIPT D'INSTALLATION COMPLETE - OLLYNC
-- ============================================
-- Ce script installe TOUT le système en une seule fois
-- Exécutez-le dans votre SQL Editor Supabase
-- Il gère automatiquement les tables existantes et ajoute les colonnes manquantes

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTIE 1 : VÉRIFICATION ET CRÉATION DES TABLES DE BASE
-- ============================================

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sous-catégories
CREATE TABLE IF NOT EXISTS sub_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Table des annonces/publications
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter toutes les colonnes à posts si elles n'existent pas
DO $$
BEGIN
  -- category_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'category_id') THEN
    ALTER TABLE posts ADD COLUMN category_id UUID;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
      ALTER TABLE posts ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- sub_category_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'sub_category_id') THEN
    ALTER TABLE posts ADD COLUMN sub_category_id UUID;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_categories') THEN
      ALTER TABLE posts ADD CONSTRAINT posts_sub_category_id_fkey FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Autres colonnes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'title') THEN
    ALTER TABLE posts ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'description') THEN
    ALTER TABLE posts ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'price') THEN
    ALTER TABLE posts ADD COLUMN price DECIMAL(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'location') THEN
    ALTER TABLE posts ADD COLUMN location VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'images') THEN
    ALTER TABLE posts ADD COLUMN images TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'delivery_available') THEN
    ALTER TABLE posts ADD COLUMN delivery_available BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_urgent') THEN
    ALTER TABLE posts ADD COLUMN is_urgent BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'needed_date') THEN
    ALTER TABLE posts ADD COLUMN needed_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'number_of_people') THEN
    ALTER TABLE posts ADD COLUMN number_of_people INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'payment_type') THEN
    ALTER TABLE posts ADD COLUMN payment_type VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_type') THEN
    ALTER TABLE posts ADD COLUMN media_type VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'status') THEN
    ALTER TABLE posts ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'views_count') THEN
    ALTER TABLE posts ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'likes_count') THEN
    ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'comments_count') THEN
    ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'shares_count') THEN
    ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'updated_at') THEN
    ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Table des likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des partages
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Table des candidatures
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, applicant_id)
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Table des matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, post_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTIE 2 : SYSTÈME DE MESSAGERIE
-- ============================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter colonnes pour groupes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'is_group') THEN
    ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'group_name') THEN
    ALTER TABLE conversations ADD COLUMN group_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'group_creator_id') THEN
    ALTER TABLE conversations ADD COLUMN group_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Table des participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Ajouter colonnes manquantes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_participants' AND column_name = 'left_at') THEN
    ALTER TABLE conversation_participants ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_participants' AND column_name = 'is_active') THEN
    ALTER TABLE conversation_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter toutes les colonnes à messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id') THEN
    ALTER TABLE messages ADD COLUMN post_id UUID;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
      ALTER TABLE messages ADD CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url') THEN
    ALTER TABLE messages ADD COLUMN link_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_title') THEN
    ALTER TABLE messages ADD COLUMN link_title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_description') THEN
    ALTER TABLE messages ADD COLUMN link_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_image_url') THEN
    ALTER TABLE messages ADD COLUMN link_image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'edited_at') THEN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  -- Modifier content pour permettre NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content' AND is_nullable = 'NO') THEN
    ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- Table des lectures de messages
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================
-- PARTIE 3 : INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index conditionnels pour messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id);
  END IF;
END $$;

-- ============================================
-- PARTIE 4 : FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour les compteurs de likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_likes_count ON likes;
CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Fonction pour mettre à jour les compteurs de commentaires
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_content TEXT,
  p_related_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, content, related_id)
  VALUES (p_user_id, p_type, p_title, p_content, p_related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier sur un like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  SELECT p.user_id, pr.full_name, p.title
  INTO post_owner_id, liker_name, post_title
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    IF liker_name IS NULL OR liker_name = '' THEN
      SELECT username INTO liker_name FROM profiles WHERE id = NEW.user_id;
      IF liker_name IS NULL OR liker_name = '' THEN
        liker_name := 'Quelqu''un';
      END IF;
    END IF;

    PERFORM create_notification(
      post_owner_id,
      'like',
      liker_name || ' a aimé votre annonce',
      COALESCE(post_title, 'Votre annonce'),
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON likes;
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

-- Fonction pour notifier sur un commentaire
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_name VARCHAR(255);
  post_title VARCHAR(255);
  comment_preview TEXT;
BEGIN
  SELECT p.user_id, pr.full_name, p.title
  INTO post_owner_id, commenter_name, post_title
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    IF commenter_name IS NULL OR commenter_name = '' THEN
      SELECT username INTO commenter_name FROM profiles WHERE id = NEW.user_id;
      IF commenter_name IS NULL OR commenter_name = '' THEN
        commenter_name := 'Quelqu''un';
      END IF;
    END IF;

    comment_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
      comment_preview := comment_preview || '...';
    END IF;

    PERFORM create_notification(
      post_owner_id,
      'comment',
      commenter_name || ' a commenté votre annonce',
      comment_preview,
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Fonction pour notifier sur un message
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  participant_record RECORD;
  sender_name VARCHAR(255);
  message_preview TEXT;
  conversation_post_id UUID;
  is_group_conversation BOOLEAN;
BEGIN
  SELECT c.post_id, COALESCE(c.is_group, false)
  INTO conversation_post_id, is_group_conversation
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  SELECT COALESCE(full_name, username, 'Quelqu''un')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  IF COALESCE(NEW.message_type, 'text') = 'text' THEN
    message_preview := LEFT(COALESCE(NEW.content, ''), 100);
    IF LENGTH(COALESCE(NEW.content, '')) > 100 THEN
      message_preview := message_preview || '...';
    END IF;
  ELSIF NEW.message_type = 'post' AND NEW.post_id IS NOT NULL THEN
    SELECT title INTO message_preview FROM posts WHERE id = NEW.post_id;
    message_preview := COALESCE(message_preview, 'Une annonce');
  ELSIF NEW.message_type = 'link' THEN
    message_preview := COALESCE(NEW.link_title, NEW.link_url, 'Un lien');
  ELSE
    message_preview := 'Un message';
  END IF;

  IF is_group_conversation THEN
    FOR participant_record IN
      SELECT user_id
      FROM conversation_participants
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id
        AND COALESCE(is_active, true) = true
    LOOP
      PERFORM create_notification(
        participant_record.user_id,
        'message',
        sender_name || ' a envoyé un message dans le groupe',
        message_preview,
        COALESCE(conversation_post_id, NEW.conversation_id::UUID)
      );
    END LOOP;
  ELSE
    SELECT CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END
    INTO recipient_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id;

    IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
      PERFORM create_notification(
        recipient_id,
        'message',
        sender_name || ' vous a envoyé un message',
        message_preview,
        COALESCE(conversation_post_id, NEW.conversation_id::UUID)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_message ON messages;
CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();

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

-- ============================================
-- PARTIE 5 : RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies de base (simplifiées pour éviter les conflits)
DO $$
BEGIN
  -- Supprimer les policies existantes si nécessaire
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  
  -- Créer les policies
  CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  
  -- Policies pour posts
  DROP POLICY IF EXISTS "Anyone can view active posts" ON posts;
  DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
  
  CREATE POLICY "Anyone can view active posts" ON posts FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
  CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
  
  -- Policies pour likes
  DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
  DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
  DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
  
  CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
  CREATE POLICY "Users can create their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
  
  -- Policies pour notifications
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
  
  CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création des policies: %', SQLERRM;
END $$;

-- ============================================
-- PARTIE 6 : DONNÉES PAR DÉFAUT
-- ============================================

-- Insérer les catégories
INSERT INTO categories (name, slug, icon, color) VALUES
  ('Match', 'match', 'Users', '#667eea'),
  ('Recrutement', 'recrutement', 'Briefcase', '#9c27b0'),
  ('Projet', 'projet', 'Briefcase', '#2196f3'),
  ('Service', 'service', 'Wrench', '#4facfe'),
  ('Vente', 'vente', 'ShoppingBag', '#f093fb'),
  ('Mission', 'mission', 'Target', '#43e97b'),
  ('Autre', 'autre', 'MoreHorizontal', '#ffa726')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Insérer les sous-catégories par défaut
-- Match
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'match'), 'Création de contenu', 'creation-contenu'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Sortie', 'sortie'),
  ((SELECT id FROM categories WHERE slug = 'match'), 'Événement', 'evenement')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Recrutement
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Modèle', 'modele'),
  ((SELECT id FROM categories WHERE slug = 'recrutement'), 'Figurant', 'figurant')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Projet
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'projet'), 'Associer / Collaboration', 'associer-collaboration')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Service
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'service'), 'Échange de service', 'echange-service'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Tâches', 'taches'),
  ((SELECT id FROM categories WHERE slug = 'service'), 'Formation', 'formation')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Vente
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Échange', 'echange'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Vente de compte', 'vente-compte'),
  ((SELECT id FROM categories WHERE slug = 'vente'), 'Gratuit', 'gratuit')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Mission
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Colis', 'colis'),
  ((SELECT id FROM categories WHERE slug = 'mission'), 'Vérification', 'verification')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Autre
INSERT INTO sub_categories (category_id, name, slug) VALUES
  ((SELECT id FROM categories WHERE slug = 'autre'), 'Non classé', 'non-classe'),
  ((SELECT id FROM categories WHERE slug = 'autre'), 'Autre service', 'autre-service')
ON CONFLICT (category_id, slug) DO UPDATE
SET name = EXCLUDED.name;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Installation terminée avec succès!';
  RAISE NOTICE 'Toutes les tables, colonnes, triggers et policies ont été créés.';
END $$;

