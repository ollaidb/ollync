-- ============================================
-- TRIGGERS POUR LES NOTIFICATIONS AUTOMATIQUES
-- ============================================
-- Ce fichier contient les triggers qui créent automatiquement des notifications
-- Exécutez ce script dans votre SQL Editor Supabase après avoir créé les tables

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

-- ============================================
-- 1. NOTIFICATIONS POUR LES LIKES
-- ============================================
-- Quand quelqu'un like une annonce, notifier le propriétaire de l'annonce
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  -- Récupérer le propriétaire de l'annonce et le nom de l'utilisateur qui like
  SELECT 
    p.user_id,
    pr.full_name,
    p.title
  INTO 
    post_owner_id,
    liker_name,
    post_title
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Ne pas notifier si l'utilisateur like sa propre annonce
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    -- Utiliser le nom d'utilisateur ou le nom complet
    IF liker_name IS NULL OR liker_name = '' THEN
      SELECT username INTO liker_name FROM profiles WHERE id = NEW.user_id;
      IF liker_name IS NULL OR liker_name = '' THEN
        liker_name := 'Quelqu''un';
      END IF;
    END IF;

    -- Créer la notification
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

CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

-- ============================================
-- 2. NOTIFICATIONS POUR LES COMMENTAIRES
-- ============================================
-- Quand quelqu'un commente une annonce, notifier le propriétaire de l'annonce
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_name VARCHAR(255);
  post_title VARCHAR(255);
  comment_preview TEXT;
BEGIN
  -- Récupérer le propriétaire de l'annonce et le nom de l'utilisateur qui commente
  SELECT 
    p.user_id,
    pr.full_name,
    p.title
  INTO 
    post_owner_id,
    commenter_name,
    post_title
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Ne pas notifier si l'utilisateur commente sa propre annonce
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    -- Utiliser le nom d'utilisateur ou le nom complet
    IF commenter_name IS NULL OR commenter_name = '' THEN
      SELECT username INTO commenter_name FROM profiles WHERE id = NEW.user_id;
      IF commenter_name IS NULL OR commenter_name = '' THEN
        commenter_name := 'Quelqu''un';
      END IF;
    END IF;

    -- Prévisualisation du commentaire (premiers 100 caractères)
    comment_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
      comment_preview := comment_preview || '...';
    END IF;

    -- Créer la notification
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

CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- ============================================
-- 3. NOTIFICATIONS POUR LES MESSAGES
-- ============================================
-- Quand quelqu'un envoie un message, notifier les destinataires
-- Supporte les conversations individuelles et les groupes
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
  -- Récupérer les informations de la conversation
  SELECT 
    c.post_id,
    c.is_group
  INTO 
    conversation_post_id,
    is_group_conversation
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(full_name, username, 'Quelqu''un')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Prévisualisation du message selon le type
  -- Utiliser COALESCE pour gérer les cas où message_type pourrait être NULL (anciennes structures)
  IF COALESCE(NEW.message_type, 'text') = 'text' THEN
    message_preview := LEFT(COALESCE(NEW.content, ''), 100);
    IF LENGTH(COALESCE(NEW.content, '')) > 100 THEN
      message_preview := message_preview || '...';
    END IF;
  ELSIF NEW.message_type = 'post' THEN
    -- Vérifier si post_id existe et n'est pas NULL
    IF NEW.post_id IS NOT NULL THEN
      SELECT title INTO message_preview FROM posts WHERE id = NEW.post_id;
      message_preview := COALESCE(message_preview, 'Une annonce');
    ELSE
      message_preview := 'Une annonce';
    END IF;
  ELSIF NEW.message_type = 'link' THEN
    message_preview := COALESCE(NEW.link_title, NEW.link_url, 'Un lien');
  ELSE
    message_preview := 'Un message';
  END IF;

  -- Si c'est une conversation de groupe
  IF is_group_conversation THEN
    -- Notifier tous les participants actifs sauf l'expéditeur
    FOR participant_record IN
      SELECT user_id
      FROM conversation_participants
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id
        AND is_active = true
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
    -- Conversation individuelle : notifier l'autre participant
    SELECT 
      CASE 
        WHEN c.user1_id = NEW.sender_id THEN c.user2_id
        ELSE c.user1_id
      END
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

CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();

-- ============================================
-- 4. NOTIFICATIONS POUR LES NOUVELLES ANNONCES
-- ============================================
-- Fonction pour notifier les utilisateurs intéressés par une nouvelle annonce
-- Cette fonction sera appelée manuellement ou via un trigger après la création d'une annonce
CREATE OR REPLACE FUNCTION notify_new_post_interested_users()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
  post_category_name VARCHAR(255);
BEGIN
  -- Récupérer le nom de la catégorie
  SELECT name INTO post_category_name
  FROM categories
  WHERE id = NEW.category_id;

  -- Trouver les utilisateurs qui ont liké des annonces dans la même catégorie
  -- et qui ne sont pas le propriétaire de la nouvelle annonce
  FOR interested_user IN
    SELECT DISTINCT l.user_id
    FROM likes l
    JOIN posts p ON p.id = l.post_id
    WHERE p.category_id = NEW.category_id
      AND l.user_id != NEW.user_id
      AND p.status = 'active'
    GROUP BY l.user_id
    HAVING COUNT(*) >= 2  -- Au moins 2 likes dans cette catégorie
    LIMIT 50  -- Limiter à 50 utilisateurs pour éviter le spam
  LOOP
    -- Créer la notification
    PERFORM create_notification(
      interested_user.user_id,
      'new_post',
      'Nouvelle annonce dans ' || COALESCE(post_category_name, 'votre catégorie préférée'),
      NEW.title,
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer des notifications lors de la création d'une nouvelle annonce
CREATE TRIGGER trigger_notify_new_post
  AFTER INSERT ON posts
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION notify_new_post_interested_users();

-- ============================================
-- PERMISSIONS
-- ============================================
-- Les fonctions utilisent SECURITY DEFINER pour contourner RLS
-- Cela permet aux triggers d'insérer des notifications même si RLS est activé
-- Note: Les policies RLS existantes dans schema.sql permettent déjà la lecture
-- et la mise à jour par les utilisateurs. Les triggers peuvent insérer grâce à SECURITY DEFINER.

