-- Script pour ajouter les colonnes manquantes à la table posts
-- Exécutez ce script si vous avez des erreurs avec category_id ou autres colonnes

-- Vérifier d'abord quelles colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'posts'
ORDER BY column_name;

-- Ajouter les colonnes manquantes une par une avec gestion d'erreur
DO $$
BEGIN
  -- category_id
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'category_id'
    ) THEN
      ALTER TABLE posts ADD COLUMN category_id UUID;
      -- Ajouter la contrainte après
      ALTER TABLE posts 
        ADD CONSTRAINT posts_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT;
      RAISE NOTICE 'Colonne category_id ajoutée';
    ELSE
      RAISE NOTICE 'Colonne category_id existe déjà';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne category_id existe déjà';
    WHEN OTHERS THEN
      RAISE WARNING 'Erreur avec category_id: %', SQLERRM;
  END;

  -- sub_category_id
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'sub_category_id'
    ) THEN
      ALTER TABLE posts ADD COLUMN sub_category_id UUID;
      ALTER TABLE posts 
        ADD CONSTRAINT posts_sub_category_id_fkey 
        FOREIGN KEY (sub_category_id) 
        REFERENCES sub_categories(id) 
        ON DELETE SET NULL;
      RAISE NOTICE 'Colonne sub_category_id ajoutée';
    ELSE
      RAISE NOTICE 'Colonne sub_category_id existe déjà';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Colonne sub_category_id existe déjà';
    WHEN OTHERS THEN
      RAISE WARNING 'Erreur avec sub_category_id: %', SQLERRM;
  END;

  -- title
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'title'
    ) THEN
      ALTER TABLE posts ADD COLUMN title VARCHAR(255);
      RAISE NOTICE 'Colonne title ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- description
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'description'
    ) THEN
      ALTER TABLE posts ADD COLUMN description TEXT;
      RAISE NOTICE 'Colonne description ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- price
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'price'
    ) THEN
      ALTER TABLE posts ADD COLUMN price DECIMAL(10, 2);
      RAISE NOTICE 'Colonne price ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- location
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'location'
    ) THEN
      ALTER TABLE posts ADD COLUMN location VARCHAR(255);
      RAISE NOTICE 'Colonne location ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- images
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'images'
    ) THEN
      ALTER TABLE posts ADD COLUMN images TEXT[];
      RAISE NOTICE 'Colonne images ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- delivery_available
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'delivery_available'
    ) THEN
      ALTER TABLE posts ADD COLUMN delivery_available BOOLEAN DEFAULT false;
      RAISE NOTICE 'Colonne delivery_available ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- is_urgent
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'is_urgent'
    ) THEN
      ALTER TABLE posts ADD COLUMN is_urgent BOOLEAN DEFAULT false;
      RAISE NOTICE 'Colonne is_urgent ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- needed_date
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'needed_date'
    ) THEN
      ALTER TABLE posts ADD COLUMN needed_date DATE;
      RAISE NOTICE 'Colonne needed_date ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- number_of_people
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'number_of_people'
    ) THEN
      ALTER TABLE posts ADD COLUMN number_of_people INTEGER;
      RAISE NOTICE 'Colonne number_of_people ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- payment_type
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'payment_type'
    ) THEN
      ALTER TABLE posts ADD COLUMN payment_type VARCHAR(20);
      RAISE NOTICE 'Colonne payment_type ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- media_type
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'media_type'
    ) THEN
      ALTER TABLE posts ADD COLUMN media_type VARCHAR(20);
      RAISE NOTICE 'Colonne media_type ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- external_link
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'external_link'
    ) THEN
      ALTER TABLE posts ADD COLUMN external_link TEXT;
      RAISE NOTICE 'Colonne external_link ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- document_url
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'document_url'
    ) THEN
      ALTER TABLE posts ADD COLUMN document_url TEXT;
      RAISE NOTICE 'Colonne document_url ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- status
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'status'
    ) THEN
      ALTER TABLE posts ADD COLUMN status VARCHAR(20) DEFAULT 'active';
      RAISE NOTICE 'Colonne status ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- views_count
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'views_count'
    ) THEN
      ALTER TABLE posts ADD COLUMN views_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Colonne views_count ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- likes_count
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'likes_count'
    ) THEN
      ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Colonne likes_count ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- comments_count
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'comments_count'
    ) THEN
      ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Colonne comments_count ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- shares_count
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'shares_count'
    ) THEN
      ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Colonne shares_count ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  -- updated_at
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Colonne updated_at ajoutée';
    END IF;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

END $$;

-- Vérifier le résultat
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
ORDER BY ordinal_position;

