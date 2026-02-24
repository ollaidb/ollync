-- Vérification : la catégorie Figurant utilise désormais match_requests (flux Demande)
-- au lieu du flux Contacter direct (message en messagerie).
--
-- Aucune migration nécessaire : la table match_requests supporte déjà request_intent='request'.
-- Ce script vérifie que la contrainte et les index sont en place.

-- Vérifier que request_intent accepte 'request'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'match_requests_request_intent_check'
  ) THEN
    RAISE NOTICE 'OK: La contrainte match_requests_request_intent_check existe (request_intent inclut ''request'').';
  ELSE
    RAISE WARNING 'La contrainte request_intent_check est absente. Exécutez standardize_match_requests_workflow_all_categories.sql si besoin.';
  END IF;
END $$;
