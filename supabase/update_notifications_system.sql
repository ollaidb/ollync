-- ============================================
-- MISE À JOUR DU SYSTÈME DE NOTIFICATIONS
-- ============================================
-- Ce script met à jour le système de notifications avec :
-- 1. Support du regroupement des notifications (1 notification par utilisateur/groupe)
-- 2. Nouveaux types de notifications (match_requests, applications, etc.)
-- 3. Structure optimisée pour l'affichage mobile
-- ============================================

-- ============================================
-- PARTIE 1 : MISE À JOUR DE LA TABLE NOTIFICATIONS
-- ============================================

-- Ajouter la colonne sender_id pour identifier l'expéditeur (pour regroupement)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
    RAISE NOTICE 'Colonne sender_id ajoutée à notifications';
  ELSE
    RAISE NOTICE 'Colonne sender_id existe déjà dans notifications';
  END IF;
END $$;

-- Ajouter la colonne group_key pour regrouper les notifications similaires
-- Format: "type_sender_id" ou "type_related_id" selon le type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'group_key'
  ) THEN
    ALTER TABLE notifications ADD COLUMN group_key VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON notifications(group_key);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_group ON notifications(user_id, group_key);
    RAISE NOTICE 'Colonne group_key ajoutée à notifications';
  ELSE
    RAISE NOTICE 'Colonne group_key existe déjà dans notifications';
  END IF;
END $$;

-- Ajouter la colonne metadata pour stocker des informations supplémentaires (JSON)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB;
    RAISE NOTICE 'Colonne metadata ajoutée à notifications';
  ELSE
    RAISE NOTICE 'Colonne metadata existe déjà dans notifications';
  END IF;
END $$;

-- ============================================
-- PARTIE 2 : FONCTION AMÉLIORÉE DE CRÉATION DE NOTIFICATION
-- ============================================

-- Fonction pour créer ou mettre à jour une notification (regroupement)
CREATE OR REPLACE FUNCTION create_or_update_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_content TEXT,
  p_related_id UUID,
  p_sender_id UUID DEFAULT NULL,
  p_group_key VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  existing_notification_id UUID;
  final_group_key VARCHAR(255);
BEGIN
  -- Déterminer la clé de regroupement si non fournie
  IF p_group_key IS NULL THEN
    IF p_sender_id IS NOT NULL THEN
      -- Regrouper par type et sender (ex: "message_user123")
      final_group_key := p_type || '_' || p_sender_id::TEXT;
    ELSIF p_related_id IS NOT NULL THEN
      -- Regrouper par type et related_id (ex: "new_post_post456")
      final_group_key := p_type || '_' || p_related_id::TEXT;
    ELSE
      -- Pas de regroupement possible
      final_group_key := p_type || '_' || gen_random_uuid()::TEXT;
    END IF;
  ELSE
    final_group_key := p_group_key;
  END IF;

  -- Types qui doivent être regroupés (1 notification par groupe)
  IF p_type IN ('message', 'match_request_received', 'match_request_sent', 'application_received', 'application_sent') THEN
    -- Chercher une notification existante non lue avec la même clé de groupe
    SELECT id INTO existing_notification_id
    FROM notifications
    WHERE user_id = p_user_id
      AND group_key = final_group_key
      AND read = false
      AND type = p_type
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_notification_id IS NOT NULL THEN
      -- Mettre à jour la notification existante
      UPDATE notifications
      SET 
        title = p_title,
        content = p_content,
        related_id = COALESCE(p_related_id, related_id),
        created_at = NOW(), -- Mettre à jour la date pour la faire remonter
        metadata = COALESCE(p_metadata, metadata)
      WHERE id = existing_notification_id;
      RETURN;
    END IF;
  END IF;

  -- Créer une nouvelle notification
  INSERT INTO notifications (
    user_id, 
    type, 
    title, 
    content, 
    related_id, 
    sender_id,
    group_key,
    metadata
  )
  VALUES (
    p_user_id, 
    p_type, 
    p_title, 
    p_content, 
    p_related_id,
    p_sender_id,
    final_group_key,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de compatibilité (ancienne fonction, maintenant utilise la nouvelle)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_content TEXT,
  p_related_id UUID
)
RETURNS void AS $$
BEGIN
  PERFORM create_or_update_notification(
    p_user_id,
    p_type,
    p_title,
    p_content,
    p_related_id,
    NULL, -- sender_id
    NULL, -- group_key (sera généré)
    NULL  -- metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTIE 3 : TRIGGERS EXISTANTS (MODIFIÉS POUR REGROUPEMENT)
-- ============================================

-- 1. NOTIFICATIONS POUR LES LIKES (inchangé, pas de regroupement nécessaire)
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
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

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    IF liker_name IS NULL OR liker_name = '' THEN
      SELECT username INTO liker_name FROM profiles WHERE id = NEW.user_id;
      IF liker_name IS NULL OR liker_name = '' THEN
        liker_name := 'Quelqu''un';
      END IF;
    END IF;

    PERFORM create_or_update_notification(
      post_owner_id,
      'like',
      liker_name || ' a aimé votre annonce',
      COALESCE(post_title, 'Votre annonce'),
      NEW.post_id,
      NEW.user_id, -- sender_id
      'like_' || NEW.post_id::TEXT || '_' || NEW.user_id::TEXT, -- group_key unique par like
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. NOTIFICATIONS POUR LES COMMENTAIRES (inchangé)
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_name VARCHAR(255);
  post_title VARCHAR(255);
  comment_preview TEXT;
BEGIN
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

    PERFORM create_or_update_notification(
      post_owner_id,
      'comment',
      commenter_name || ' a commenté votre annonce',
      comment_preview,
      NEW.post_id,
      NEW.user_id,
      'comment_' || NEW.post_id::TEXT || '_' || NEW.user_id::TEXT,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. NOTIFICATIONS POUR LES MESSAGES (MODIFIÉ POUR REGROUPEMENT)
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  participant_record RECORD;
  sender_name VARCHAR(255);
  message_preview TEXT;
  conversation_post_id UUID;
  is_group_conversation BOOLEAN;
  group_name VARCHAR(255);
BEGIN
  SELECT 
    c.post_id,
    COALESCE(c.is_group, false)
  INTO 
    conversation_post_id,
    is_group_conversation
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  SELECT COALESCE(full_name, username, 'Quelqu''un')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Prévisualisation du message
  IF COALESCE(NEW.message_type, 'text') = 'text' THEN
    message_preview := LEFT(COALESCE(NEW.content, ''), 100);
    IF LENGTH(COALESCE(NEW.content, '')) > 100 THEN
      message_preview := message_preview || '...';
    END IF;
  ELSIF NEW.message_type = 'post' THEN
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

  IF is_group_conversation THEN
    -- Récupérer le nom du groupe si disponible
    SELECT name INTO group_name FROM conversations WHERE id = NEW.conversation_id;
    
    FOR participant_record IN
      SELECT user_id
      FROM conversation_participants
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id
        AND COALESCE(is_active, true) = true
    LOOP
      PERFORM create_or_update_notification(
        participant_record.user_id,
        'message',
        sender_name || ' a envoyé un message' || COALESCE(' dans ' || group_name, ' dans le groupe'),
        message_preview,
        COALESCE(conversation_post_id, NEW.conversation_id::UUID),
        NEW.sender_id, -- sender_id pour regroupement
        'message_' || NEW.conversation_id::TEXT || '_' || NEW.sender_id::TEXT, -- group_key: 1 notification par conversation/sender
        jsonb_build_object('conversation_id', NEW.conversation_id, 'is_group', true)
      );
    END LOOP;
  ELSE
    SELECT CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END
    INTO recipient_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id;

    IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
      PERFORM create_or_update_notification(
        recipient_id,
        'message',
        sender_name || ' vous a envoyé un message',
        message_preview,
        COALESCE(conversation_post_id, NEW.conversation_id::UUID),
        NEW.sender_id, -- sender_id pour regroupement
        'message_' || NEW.conversation_id::TEXT || '_' || NEW.sender_id::TEXT, -- group_key: 1 notification par conversation/sender
        jsonb_build_object('conversation_id', NEW.conversation_id, 'is_group', false)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. NOTIFICATIONS POUR LES NOUVELLES ANNONCES (inchangé)
CREATE OR REPLACE FUNCTION notify_new_post_interested_users()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
  post_category_name VARCHAR(255);
BEGIN
  SELECT name INTO post_category_name
  FROM categories
  WHERE id = NEW.category_id;

  FOR interested_user IN
    SELECT DISTINCT l.user_id
    FROM likes l
    JOIN posts p ON p.id = l.post_id
    WHERE p.category_id = NEW.category_id
      AND l.user_id != NEW.user_id
      AND p.status = 'active'
    GROUP BY l.user_id
    HAVING COUNT(*) >= 2
    LIMIT 50
  LOOP
    PERFORM create_or_update_notification(
      interested_user.user_id,
      'new_post',
      'Nouvelle annonce dans ' || COALESCE(post_category_name, 'votre catégorie préférée'),
      NEW.title,
      NEW.id,
      NULL,
      'new_post_' || NEW.id::TEXT, -- group_key unique par post
      jsonb_build_object('category_id', NEW.category_id, 'category_name', post_category_name)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTIE 4 : NOUVEAUX TRIGGERS POUR MATCH_REQUESTS
-- ============================================

-- Notification quand une demande de match est envoyée
CREATE OR REPLACE FUNCTION notify_match_request_sent()
RETURNS TRIGGER AS $$
DECLARE
  post_title VARCHAR(255);
  sender_name VARCHAR(255);
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(full_name, username, 'Vous')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.from_user_id;

  -- Récupérer le titre de l'annonce si disponible
  IF NEW.related_post_id IS NOT NULL THEN
    SELECT title INTO post_title FROM posts WHERE id = NEW.related_post_id;
  END IF;

  -- Notifier l'expéditeur (confirmation)
  PERFORM create_or_update_notification(
    NEW.from_user_id,
    'match_request_sent',
    'Vous avez envoyé une demande',
    COALESCE(post_title, 'pour une annonce'),
    NEW.related_post_id,
    NULL,
    'match_request_sent_' || NEW.from_user_id::TEXT || '_' || COALESCE(NEW.related_post_id::TEXT, NEW.id::TEXT),
    jsonb_build_object('match_request_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une demande de match est reçue
CREATE OR REPLACE FUNCTION notify_match_request_received()
RETURNS TRIGGER AS $$
DECLARE
  sender_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(full_name, username, 'Quelqu''un')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.from_user_id;

  -- Récupérer le titre de l'annonce si disponible
  IF NEW.related_post_id IS NOT NULL THEN
    SELECT title INTO post_title FROM posts WHERE id = NEW.related_post_id;
  END IF;

  -- Notifier le destinataire
  PERFORM create_or_update_notification(
    NEW.to_user_id,
    'match_request_received',
    sender_name || ' vous a envoyé une demande',
    COALESCE(post_title, 'pour une annonce'),
    NEW.related_post_id,
    NEW.from_user_id, -- sender_id pour regroupement
    'match_request_received_' || NEW.to_user_id::TEXT || '_' || NEW.from_user_id::TEXT, -- group_key: 1 notification par expéditeur
    jsonb_build_object('match_request_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une demande de match est acceptée
CREATE OR REPLACE FUNCTION notify_match_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  acceptor_name VARCHAR(255);
  requester_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  -- Ne notifier que si le statut passe de 'pending' à 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Récupérer les noms
    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO acceptor_name
    FROM profiles
    WHERE id = NEW.to_user_id;

    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO requester_name
    FROM profiles
    WHERE id = NEW.from_user_id;

    -- Récupérer le titre de l'annonce
    IF NEW.related_post_id IS NOT NULL THEN
      SELECT title INTO post_title FROM posts WHERE id = NEW.related_post_id;
    END IF;

    -- Notifier l'expéditeur de la demande (celui qui a envoyé)
    PERFORM create_or_update_notification(
      NEW.from_user_id,
      'match_request_accepted',
      acceptor_name || ' a accepté votre demande',
      COALESCE(post_title, 'Votre demande a été acceptée'),
      NEW.related_post_id,
      NEW.to_user_id,
      'match_request_accepted_' || NEW.from_user_id::TEXT || '_' || NEW.related_post_id::TEXT,
      jsonb_build_object('match_request_id', NEW.id, 'conversation_id', NEW.conversation_id)
    );

    -- Notifier le destinataire (celui qui a accepté) - confirmation
    PERFORM create_or_update_notification(
      NEW.to_user_id,
      'match_request_accepted',
      'Vous avez accepté la demande de ' || requester_name,
      COALESCE(post_title, 'La demande a été acceptée'),
      NEW.related_post_id,
      NEW.from_user_id,
      'match_request_accepted_' || NEW.to_user_id::TEXT || '_' || NEW.related_post_id::TEXT,
      jsonb_build_object('match_request_id', NEW.id, 'conversation_id', NEW.conversation_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une demande de match est refusée
CREATE OR REPLACE FUNCTION notify_match_request_declined()
RETURNS TRIGGER AS $$
DECLARE
  decliner_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  -- Ne notifier que si le statut passe à 'declined'
  IF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO decliner_name
    FROM profiles
    WHERE id = NEW.to_user_id;

    IF NEW.related_post_id IS NOT NULL THEN
      SELECT title INTO post_title FROM posts WHERE id = NEW.related_post_id;
    END IF;

    -- Notifier l'expéditeur (discret, pas de spam)
    PERFORM create_or_update_notification(
      NEW.from_user_id,
      'match_request_declined',
      'Votre demande n''a pas été acceptée',
      COALESCE(post_title, 'pour une annonce'),
      NEW.related_post_id,
      NEW.to_user_id,
      'match_request_declined_' || NEW.from_user_id::TEXT || '_' || NEW.related_post_id::TEXT,
      jsonb_build_object('match_request_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour match_requests
DROP TRIGGER IF EXISTS trigger_notify_match_request_sent ON match_requests;
CREATE TRIGGER trigger_notify_match_request_sent
  AFTER INSERT ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_request_sent();

DROP TRIGGER IF EXISTS trigger_notify_match_request_received ON match_requests;
CREATE TRIGGER trigger_notify_match_request_received
  AFTER INSERT ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_request_received();

DROP TRIGGER IF EXISTS trigger_notify_match_request_accepted ON match_requests;
CREATE TRIGGER trigger_notify_match_request_accepted
  AFTER UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_request_accepted();

DROP TRIGGER IF EXISTS trigger_notify_match_request_declined ON match_requests;
CREATE TRIGGER trigger_notify_match_request_declined
  AFTER UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_request_declined();

-- ============================================
-- PARTIE 5 : NOUVEAUX TRIGGERS POUR APPLICATIONS
-- ============================================

-- Notification quand une candidature est envoyée
CREATE OR REPLACE FUNCTION notify_application_sent()
RETURNS TRIGGER AS $$
DECLARE
  post_title VARCHAR(255);
  applicant_name VARCHAR(255);
BEGIN
  SELECT title INTO post_title FROM posts WHERE id = NEW.post_id;
  
  SELECT COALESCE(full_name, username, 'Vous')
  INTO applicant_name
  FROM profiles
  WHERE id = NEW.applicant_id;

  -- Notifier l'expéditeur (confirmation)
  PERFORM create_or_update_notification(
    NEW.applicant_id,
    'application_sent',
    'Vous avez postulé',
    COALESCE(post_title, 'pour une annonce'),
    NEW.post_id,
    NULL,
    'application_sent_' || NEW.applicant_id::TEXT || '_' || NEW.post_id::TEXT,
    jsonb_build_object('application_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une candidature est reçue
CREATE OR REPLACE FUNCTION notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  applicant_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  -- Récupérer le propriétaire de l'annonce
  SELECT user_id, title
  INTO post_owner_id, post_title
  FROM posts
  WHERE id = NEW.post_id;

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.applicant_id THEN
    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO applicant_name
    FROM profiles
    WHERE id = NEW.applicant_id;

    -- Notifier le propriétaire de l'annonce
    PERFORM create_or_update_notification(
      post_owner_id,
      'application_received',
      applicant_name || ' a postulé pour votre annonce',
      COALESCE(post_title, 'Votre annonce'),
      NEW.post_id,
      NEW.applicant_id, -- sender_id pour regroupement
      'application_received_' || post_owner_id::TEXT || '_' || NEW.applicant_id::TEXT, -- group_key: 1 notification par candidat
      jsonb_build_object('application_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une candidature est acceptée
CREATE OR REPLACE FUNCTION notify_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_name VARCHAR(255);
  post_title VARCHAR(255);
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT title INTO post_title FROM posts WHERE id = NEW.post_id;
    
    SELECT COALESCE(full_name, username, 'Quelqu''un')
    INTO post_owner_name
    FROM profiles p
    JOIN posts po ON po.user_id = p.id
    WHERE po.id = NEW.post_id;

    -- Notifier le candidat
    PERFORM create_or_update_notification(
      NEW.applicant_id,
      'application_accepted',
      'Votre candidature a été acceptée',
      COALESCE(post_title, 'pour une annonce'),
      NEW.post_id,
      NULL,
      'application_accepted_' || NEW.applicant_id::TEXT || '_' || NEW.post_id::TEXT,
      jsonb_build_object('application_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification quand une candidature est refusée
CREATE OR REPLACE FUNCTION notify_application_declined()
RETURNS TRIGGER AS $$
DECLARE
  post_title VARCHAR(255);
BEGIN
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    SELECT title INTO post_title FROM posts WHERE id = NEW.post_id;

    -- Notifier le candidat (discret)
    PERFORM create_or_update_notification(
      NEW.applicant_id,
      'application_declined',
      'Votre candidature n''a pas été retenue',
      COALESCE(post_title, 'pour une annonce'),
      NEW.post_id,
      NULL,
      'application_declined_' || NEW.applicant_id::TEXT || '_' || NEW.post_id::TEXT,
      jsonb_build_object('application_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour applications
DROP TRIGGER IF EXISTS trigger_notify_application_sent ON applications;
CREATE TRIGGER trigger_notify_application_sent
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_sent();

DROP TRIGGER IF EXISTS trigger_notify_application_received ON applications;
CREATE TRIGGER trigger_notify_application_received
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_received();

DROP TRIGGER IF EXISTS trigger_notify_application_accepted ON applications;
CREATE TRIGGER trigger_notify_application_accepted
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_accepted();

DROP TRIGGER IF EXISTS trigger_notify_application_declined ON applications;
CREATE TRIGGER trigger_notify_application_declined
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_declined();

-- ============================================
-- PARTIE 6 : NOTIFICATIONS POUR GROUPES
-- ============================================

-- Notification quand un utilisateur est ajouté à un groupe
CREATE OR REPLACE FUNCTION notify_group_added()
RETURNS TRIGGER AS $$
DECLARE
  group_name VARCHAR(255);
  adder_name VARCHAR(255);
  conversation_post_id UUID;
BEGIN
  -- Récupérer le nom du groupe et l'ID de l'annonce
  SELECT c.name, c.post_id
  INTO group_name, conversation_post_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Récupérer le nom de celui qui a ajouté (si disponible via metadata ou autre)
  -- Pour l'instant, on utilise un message générique
  adder_name := 'Vous avez été ajouté(e)';

  -- Notifier l'utilisateur ajouté
  PERFORM create_or_update_notification(
    NEW.user_id,
    'group_added',
    adder_name || ' au groupe ' || COALESCE(group_name, ''),
    COALESCE(group_name, 'Un nouveau groupe'),
    conversation_post_id,
    NULL,
    'group_added_' || NEW.user_id::TEXT || '_' || NEW.conversation_id::TEXT,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'group_name', group_name)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour group_added (se déclenche quand un participant est ajouté)
DROP TRIGGER IF EXISTS trigger_notify_group_added ON conversation_participants;
CREATE TRIGGER trigger_notify_group_added
  AFTER INSERT ON conversation_participants
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION notify_group_added();

-- ============================================
-- PARTIE 7 : NOTIFICATIONS POUR POSTS (MISES À JOUR, EXPIRATION)
-- ============================================

-- Notification quand un post est mis à jour
CREATE OR REPLACE FUNCTION notify_post_updated()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
BEGIN
  -- Notifier les utilisateurs qui ont liké ou commenté ce post
  FOR interested_user IN
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM likes WHERE post_id = NEW.id
      UNION
      SELECT user_id FROM comments WHERE post_id = NEW.id
      UNION
      SELECT applicant_id as user_id FROM applications WHERE post_id = NEW.id
    ) interested
    WHERE user_id != NEW.user_id
  LOOP
    PERFORM create_or_update_notification(
      interested_user.user_id,
      'post_updated',
      'Une annonce que vous suivez a été mise à jour',
      NEW.title,
      NEW.id,
      NULL,
      'post_updated_' || NEW.id::TEXT || '_' || interested_user.user_id::TEXT,
      jsonb_build_object('post_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour post_updated (se déclenche sur UPDATE significatif)
DROP TRIGGER IF EXISTS trigger_notify_post_updated ON posts;
CREATE TRIGGER trigger_notify_post_updated
  AFTER UPDATE ON posts
  FOR EACH ROW
  WHEN (
    OLD.status = 'active' AND NEW.status = 'active' AND
    (OLD.title IS DISTINCT FROM NEW.title OR 
     OLD.content IS DISTINCT FROM NEW.content OR
     OLD.needed_date IS DISTINCT FROM NEW.needed_date)
  )
  EXECUTE FUNCTION notify_post_updated();

-- Notification quand un post est clôturé/expiré
CREATE OR REPLACE FUNCTION notify_post_closed()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
BEGIN
  -- Notifier les utilisateurs qui ont postulé ou envoyé une demande
  IF NEW.status IN ('closed', 'expired', 'completed') AND OLD.status = 'active' THEN
    FOR interested_user IN
      SELECT DISTINCT user_id
      FROM (
        SELECT applicant_id as user_id FROM applications WHERE post_id = NEW.id AND status = 'pending'
        UNION
        SELECT from_user_id as user_id FROM match_requests WHERE related_post_id = NEW.id AND status = 'pending'
      ) interested
    LOOP
      PERFORM create_or_update_notification(
        interested_user.user_id,
        'post_closed',
        'Une annonce à laquelle vous avez répondu est clôturée',
        NEW.title,
        NEW.id,
        NULL,
        'post_closed_' || NEW.id::TEXT || '_' || interested_user.user_id::TEXT,
        jsonb_build_object('post_id', NEW.id, 'status', NEW.status)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour post_closed
DROP TRIGGER IF EXISTS trigger_notify_post_closed ON posts;
CREATE TRIGGER trigger_notify_post_closed
  AFTER UPDATE ON posts
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status IN ('closed', 'expired', 'completed'))
  EXECUTE FUNCTION notify_post_closed();

-- ============================================
-- PARTIE 8 : NOTIFICATION DE BIENVENUE
-- ============================================
-- Cette notification doit être créée manuellement lors de l'inscription
-- ou via un trigger sur la table profiles (après création)

-- Fonction pour créer une notification de bienvenue
CREATE OR REPLACE FUNCTION create_welcome_notification(p_user_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM create_or_update_notification(
    p_user_id,
    'welcome',
    'Bienvenue sur Ollync 👋',
    'Commencez par explorer les annonces et trouvez votre prochaine collaboration',
    NULL,
    NULL,
    'welcome_' || p_user_id::TEXT,
    jsonb_build_object('is_welcome', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTIE 9 : NETTOYAGE ET OPTIMISATION
-- ============================================

-- Fonction pour nettoyer les anciennes notifications lues (optionnel, à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Supprimer les notifications lues de plus de 30 jours
  DELETE FROM notifications
  WHERE read = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index supplémentaires pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Ce script a mis à jour le système de notifications avec :
-- ✅ Support du regroupement (1 notification par utilisateur/groupe)
-- ✅ Nouveaux types de notifications (match_requests, applications, groupes, etc.)
-- ✅ Structure optimisée pour l'affichage mobile
-- ✅ Colonnes supplémentaires (sender_id, group_key, metadata)
-- ============================================

