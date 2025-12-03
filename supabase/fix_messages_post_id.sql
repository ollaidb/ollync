-- ============================================
-- CORRECTION : Ajouter la colonne post_id à messages
-- ============================================
-- Ce script corrige l'erreur "column post_id does not exist"
-- Exécutez ce script dans votre SQL Editor Supabase

-- 1. Vérifier si la table messages existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'messages'
  ) THEN
    RAISE EXCEPTION 'La table messages n''existe pas. Exécutez d''abord create_messaging_tables.sql';
  END IF;
END $$;

-- 2. Ajouter la colonne post_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'post_id'
  ) THEN
    -- Vérifier que la table posts existe avant d'ajouter la référence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'posts'
    ) THEN
      ALTER TABLE messages ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ Colonne post_id ajoutée à la table messages';
    ELSE
      -- Si posts n'existe pas, ajouter sans référence pour l'instant
      ALTER TABLE messages ADD COLUMN post_id UUID;
      RAISE NOTICE '✅ Colonne post_id ajoutée (sans référence car posts n''existe pas encore)';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  Colonne post_id existe déjà dans la table messages';
  END IF;
END $$;

-- 3. Ajouter les autres colonnes manquantes si nécessaire
DO $$ 
BEGIN
  -- message_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
    RAISE NOTICE '✅ Colonne message_type ajoutée';
  END IF;

  -- link_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'link_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_url TEXT;
    RAISE NOTICE '✅ Colonne link_url ajoutée';
  END IF;

  -- link_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'link_title'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_title TEXT;
    RAISE NOTICE '✅ Colonne link_title ajoutée';
  END IF;

  -- link_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'link_description'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_description TEXT;
    RAISE NOTICE '✅ Colonne link_description ajoutée';
  END IF;

  -- link_image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'link_image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN link_image_url TEXT;
    RAISE NOTICE '✅ Colonne link_image_url ajoutée';
  END IF;

  -- reply_to_message_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'reply_to_message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Colonne reply_to_message_id ajoutée';
  END IF;

  -- edited_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne edited_at ajoutée';
  END IF;

  -- deleted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Colonne deleted_at ajoutée';
  END IF;
END $$;

-- 4. Modifier content pour permettre NULL (si nécessaire)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'content'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
    RAISE NOTICE '✅ Contrainte NOT NULL retirée de content';
  END IF;
END $$;

-- 5. Ajouter les contraintes si elles n'existent pas
DO $$
BEGIN
  -- check_message_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_type'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_type'
    ) THEN
      ALTER TABLE messages ADD CONSTRAINT check_message_type 
        CHECK (message_type IN ('text', 'post', 'link'));
      RAISE NOTICE '✅ Contrainte check_message_type ajoutée';
    END IF;
  END IF;

  -- check_message_content (nécessite toutes les colonnes)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_message_content'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url') THEN
      ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
        (message_type = 'text' AND content IS NOT NULL) OR
        (message_type = 'post' AND post_id IS NOT NULL) OR
        (message_type = 'link' AND link_url IS NOT NULL)
      );
      RAISE NOTICE '✅ Contrainte check_message_content ajoutée';
    END IF;
  END IF;
END $$;

-- 6. Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- 7. Vérification finale
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 8. Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Correction terminée!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'La colonne post_id a été ajoutée à messages';
  RAISE NOTICE 'Toutes les colonnes nécessaires sont maintenant en place';
  RAISE NOTICE '========================================';
END $$;

