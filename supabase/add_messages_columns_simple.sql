-- Script simple pour ajouter les colonnes manquantes à la table messages
-- Exécutez ce script si les colonnes n'ont pas été ajoutées correctement

-- Ajouter message_type
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';

-- Ajouter post_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Ajouter link_url
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Ajouter link_title
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_title TEXT;

-- Ajouter link_description
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_description TEXT;

-- Ajouter link_image_url
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_image_url TEXT;

-- Ajouter reply_to_message_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Ajouter edited_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Ajouter deleted_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Modifier content pour permettre NULL
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Ajouter les contraintes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_type 
      CHECK (message_type IN ('text', 'post', 'link'));
  END IF;
END $$;

-- Ajouter la contrainte check_message_content (nécessite que toutes les colonnes existent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_content') THEN
    ALTER TABLE messages ADD CONSTRAINT check_message_content CHECK (
      (message_type = 'text' AND content IS NOT NULL) OR
      (message_type = 'post' AND post_id IS NOT NULL) OR
      (message_type = 'link' AND link_url IS NOT NULL)
    );
  END IF;
END $$;

