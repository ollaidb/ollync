-- Contrats partagés par message + brouillons multiples

-- 1) Messages: support du type "contract_share"
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS shared_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_shared_contract_id
  ON public.messages(shared_contract_id)
  WHERE shared_contract_id IS NOT NULL;

-- Autoriser le nouveau type de message (si la contrainte existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_message_type'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT check_message_type;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT check_message_type CHECK (
      message_type IN (
        'text',
        'photo',
        'video',
        'document',
        'post_share',
        'profile_share',
        'calendar_request',
        'location',
        'price',
        'rate',
        'link',
        'post',
        'contract_share'
      )
    );
  END IF;
END $$;

-- 2) Contrats: suivi d'ouverture / acceptation des 2 parties
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS creator_opened_at TIMESTAMPTZ;

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS counterparty_opened_at TIMESTAMPTZ;

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS creator_accepted_at TIMESTAMPTZ;

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS counterparty_accepted_at TIMESTAMPTZ;

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_contracts_counterparty_acceptance
  ON public.contracts(counterparty_id, counterparty_accepted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_creator_acceptance
  ON public.contracts(creator_id, creator_accepted_at, created_at DESC);

-- 3) contract_drafts: permettre plusieurs brouillons par utilisateur
DROP INDEX IF EXISTS public.contract_drafts_user_id_key;

CREATE INDEX IF NOT EXISTS idx_contract_drafts_user_updated
  ON public.contract_drafts(user_id, updated_at DESC);

