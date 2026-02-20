-- Étend les match_requests pour:
-- 1) Candidature emploi: CV obligatoire + lettre de motivation optionnelle
-- 2) Réservation lieu / billet événement: date, heure, durée

ALTER TABLE public.match_requests
  ADD COLUMN IF NOT EXISTS request_cover_letter_url TEXT,
  ADD COLUMN IF NOT EXISTS request_cover_letter_name TEXT,
  ADD COLUMN IF NOT EXISTS request_intent TEXT,
  ADD COLUMN IF NOT EXISTS reservation_date DATE,
  ADD COLUMN IF NOT EXISTS reservation_time TIME,
  ADD COLUMN IF NOT EXISTS reservation_duration_minutes INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'match_requests_request_intent_check'
  ) THEN
    ALTER TABLE public.match_requests
      ADD CONSTRAINT match_requests_request_intent_check
      CHECK (
        request_intent IS NULL
        OR request_intent IN ('request', 'apply', 'buy', 'reserve', 'ticket')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_requests_request_intent
  ON public.match_requests(request_intent);

