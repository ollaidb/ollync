-- Script de correction pour ajouter les colonnes manquantes à la table messages
-- Exécutez ce script si vous avez des erreurs avec post_id ou autres colonnes

-- Vérifier d'abord quelles colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY column_name;

-- Ajouter les colonnes une par une avec gestion d'erreur
DO $$
BEGIN
  -- message_type
  BEGIN
    ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
    RAISE NOTICE 'Colonne message_type ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne message_type existe déjà';
  END;

  -- post_id
  BEGIN
    ALTER TABLE messages ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne post_id ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne post_id existe déjà';
  END;

  -- link_url
  BEGIN
    ALTER TABLE messages ADD COLUMN link_url TEXT;
    RAISE NOTICE 'Colonne link_url ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne link_url existe déjà';
  END;

  -- link_title
  BEGIN
    ALTER TABLE messages ADD COLUMN link_title TEXT;
    RAISE NOTICE 'Colonne link_title ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne link_title existe déjà';
  END;

  -- link_description
  BEGIN
    ALTER TABLE messages ADD COLUMN link_description TEXT;
    RAISE NOTICE 'Colonne link_description ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne link_description existe déjà';
  END;

  -- link_image_url
  BEGIN
    ALTER TABLE messages ADD COLUMN link_image_url TEXT;
    RAISE NOTICE 'Colonne link_image_url ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne link_image_url existe déjà';
  END;

  -- reply_to_message_id
  BEGIN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne reply_to_message_id ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne reply_to_message_id existe déjà';
  END;

  -- edited_at
  BEGIN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne edited_at ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne edited_at existe déjà';
  END;

  -- deleted_at
  BEGIN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne deleted_at ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne deleted_at existe déjà';
  END;

  -- Modifier content pour permettre NULL
  BEGIN
    ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
    RAISE NOTICE 'Contrainte NOT NULL retirée de content';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Impossible de modifier content: %', SQLERRM;
  END;
END $$;

-- Ajouter les contraintes
DO $$
BEGIN
  -- check_message_type
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_type 
      CHECK (message_type IN ('text', 'post', 'link'));
    RAISE NOTICE 'Contrainte check_message_type ajoutée';
  END IF;

  -- check_message_content (nécessite que toutes les colonnes existent)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_content') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'post_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'link_url') THEN
      ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
        (message_type = 'text' AND content IS NOT NULL) OR
        (message_type = 'post' AND post_id IS NOT NULL) OR
        (message_type = 'link' AND link_url IS NOT NULL)
      );
      RAISE NOTICE 'Contrainte check_message_content ajoutée';
    END IF;
  END IF;
END $$;

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Vérifier le résultat
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

