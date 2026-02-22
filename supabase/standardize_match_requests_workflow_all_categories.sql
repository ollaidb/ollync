-- =========================================================
-- STANDARDISATION WORKFLOW DEMANDES (toutes catégories)
-- Objectif:
-- - toutes les demandes passent par match_requests (pending -> accepted/declined)
-- - supporter emploi (CV/lettre), vente, casting, creation, evenements, lieu
-- - garder accepted_at + conversation_id pour suivi conversation
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1) Colonnes nécessaires
-- ---------------------------------------------------------
alter table if exists public.match_requests
  add column if not exists request_message text,
  add column if not exists request_role text,
  add column if not exists request_document_url text,
  add column if not exists request_document_name text,
  add column if not exists request_cover_letter_url text,
  add column if not exists request_cover_letter_name text,
  add column if not exists request_intent text,
  add column if not exists reservation_date date,
  add column if not exists reservation_time time,
  add column if not exists reservation_duration_minutes integer,
  add column if not exists accepted_at timestamptz,
  add column if not exists conversation_id uuid;

-- FK conversation_id si absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'match_requests_conversation_id_fkey'
  ) THEN
    ALTER TABLE public.match_requests
      ADD CONSTRAINT match_requests_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- 2) Contraintes status + intent
-- ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_requests_status_check'
  ) THEN
    ALTER TABLE public.match_requests
      ADD CONSTRAINT match_requests_status_check
      CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_requests_request_intent_check'
  ) THEN
    ALTER TABLE public.match_requests
      ADD CONSTRAINT match_requests_request_intent_check
      CHECK (
        request_intent IS NULL
        OR request_intent IN ('request', 'apply', 'buy', 'reserve', 'ticket')
      );
  END IF;
END $$;

-- ---------------------------------------------------------
-- 3) Auto accepted_at à l’acceptation
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_match_request_accepted_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'accepted' AND COALESCE(OLD.status, '') <> 'accepted' THEN
    NEW.accepted_at = COALESCE(NEW.accepted_at, now());
  END IF;

  IF NEW.status <> 'accepted' AND OLD.status = 'accepted' THEN
    NEW.accepted_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_match_request_accepted_at ON public.match_requests;
CREATE TRIGGER trg_set_match_request_accepted_at
BEFORE UPDATE ON public.match_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_match_request_accepted_at();

-- backfill historique
update public.match_requests
set accepted_at = coalesce(accepted_at, updated_at, created_at)
where status = 'accepted' and accepted_at is null;

-- ---------------------------------------------------------
-- 4) Index pour "Demandes" + "Matchs"
-- ---------------------------------------------------------
create index if not exists idx_match_requests_from_status_created
  on public.match_requests(from_user_id, status, created_at desc);

create index if not exists idx_match_requests_to_status_created
  on public.match_requests(to_user_id, status, created_at desc);

create index if not exists idx_match_requests_intent_status
  on public.match_requests(request_intent, status);

create index if not exists idx_match_requests_conversation_id
  on public.match_requests(conversation_id);

create index if not exists idx_match_requests_related_post_id
  on public.match_requests(related_post_id);

-- ---------------------------------------------------------
-- 5) RLS: envoyer / accepter-refuser / annuler
-- ---------------------------------------------------------
alter table public.match_requests enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='match_requests'
      AND policyname='match_requests_select_own'
  ) THEN
    CREATE POLICY match_requests_select_own ON public.match_requests
      FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='match_requests'
      AND policyname='match_requests_insert_sender'
  ) THEN
    CREATE POLICY match_requests_insert_sender ON public.match_requests
      FOR INSERT WITH CHECK (auth.uid() = from_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='match_requests'
      AND policyname='match_requests_update_sender_or_receiver'
  ) THEN
    CREATE POLICY match_requests_update_sender_or_receiver ON public.match_requests
      FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
      WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
END $$;

commit;

-- =========================================================
-- Optionnel (ne pas lancer automatiquement):
-- Si tu veux forcer les anciennes demandes "event ticket" auto-acceptées
-- à repasser en pending pour validation manuelle, exécute séparément:
--
-- update public.match_requests
-- set status='pending', accepted_at=null
-- where request_intent='ticket' and status='accepted';
-- =========================================================
