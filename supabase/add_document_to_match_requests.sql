-- ============================================
-- ADD DOCUMENT URL TO MATCH_REQUESTS TABLE
-- ============================================
-- Pour permettre l'envoi de documents (CV, etc) avec les demandes de match
-- Particulièrement utile pour la catégorie "emploi"

-- Ajouter la colonne request_document_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'request_document_url'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN request_document_url TEXT;
    RAISE NOTICE 'Colonne request_document_url ajoutée à match_requests';
  ELSE
    RAISE NOTICE 'Colonne request_document_url existe déjà sur match_requests';
  END IF;
END $$;

-- Ajouter la colonne request_document_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'match_requests'
      AND column_name = 'request_document_name'
  ) THEN
    ALTER TABLE match_requests ADD COLUMN request_document_name TEXT;
    RAISE NOTICE 'Colonne request_document_name ajoutée à match_requests';
  ELSE
    RAISE NOTICE 'Colonne request_document_name existe déjà sur match_requests';
  END IF;
END $$;

-- Créer un index pour request_document_url si la colonne a été créée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'match_requests'
      AND indexname = 'idx_match_requests_request_document_url'
  ) THEN
    CREATE INDEX idx_match_requests_request_document_url ON match_requests(request_document_url);
    RAISE NOTICE 'Index créé pour request_document_url';
  END IF;
END $$;
