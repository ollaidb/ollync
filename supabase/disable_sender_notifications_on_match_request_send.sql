-- =========================================================
-- RECTIFICATION: ne PAS notifier l'expediteur a l'envoi
-- On garde les notifications de reception / acceptation / refus
-- =========================================================

begin;

-- 1) Supprimer les triggers legacy qui notifient l'expediteur a l'INSERT
DROP TRIGGER IF EXISTS trigger_notify_match_request_sent ON public.match_requests;
DROP TRIGGER IF EXISTS trg_notify_match_request_sent ON public.match_requests;

-- 2) Supprimer la fonction legacy si presente
DROP FUNCTION IF EXISTS public.notify_match_request_sent();

-- 3) Nettoyage optionnel: retirer les anciennes notifs "match_request_sent"
DELETE FROM public.notifications
WHERE type = 'match_request_sent';

commit;
