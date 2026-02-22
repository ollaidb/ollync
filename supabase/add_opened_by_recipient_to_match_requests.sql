-- Marque une demande reçue comme "ouverte" quand le destinataire clique dessus
ALTER TABLE public.match_requests
ADD COLUMN IF NOT EXISTS opened_by_recipient_at TIMESTAMP WITH TIME ZONE;

-- Marque une demande comme "ouverte" côté expéditeur quand il clique sur le bloc
ALTER TABLE public.match_requests
ADD COLUMN IF NOT EXISTS opened_by_sender_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_match_requests_to_status_opened
  ON public.match_requests (to_user_id, status, opened_by_recipient_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_requests_from_status_opened
  ON public.match_requests (from_user_id, status, opened_by_sender_at, created_at DESC);
