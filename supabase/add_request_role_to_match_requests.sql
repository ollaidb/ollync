-- Ajout du poste demandé sur une match request
ALTER TABLE public.match_requests
  ADD COLUMN IF NOT EXISTS request_role TEXT;
