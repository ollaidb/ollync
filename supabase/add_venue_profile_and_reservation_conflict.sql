-- =====================================================
-- Venue profile fields + reservation conflict protection
-- =====================================================

-- 1) Champs profil pour les comptes "lieu"
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS venue_opening_hours JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS venue_billing_hours INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS venue_payment_types TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.venue_opening_hours IS
'Horaires du lieu [{day, enabled, start, end}]';
COMMENT ON COLUMN public.profiles.venue_billing_hours IS
'Durée/temps facturé par défaut en minutes';
COMMENT ON COLUMN public.profiles.venue_payment_types IS
'Moyens de paiement du lieu (ids payment_type)';

-- 2) Fonction réutilisable : détecter un conflit de créneau
CREATE OR REPLACE FUNCTION public.check_reservation_slot_conflict(
  p_to_user_id UUID,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_duration_minutes INTEGER DEFAULT 60,
  p_ignore_request_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_start TIMESTAMP;
  v_new_end TIMESTAMP;
BEGIN
  IF p_to_user_id IS NULL OR p_reservation_date IS NULL OR p_reservation_time IS NULL THEN
    RETURN FALSE;
  END IF;

  v_new_start := p_reservation_date::timestamp + p_reservation_time;
  v_new_end := v_new_start + make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 60), 1));

  RETURN EXISTS (
    SELECT 1
    FROM public.match_requests mr
    WHERE mr.to_user_id = p_to_user_id
      AND mr.request_intent = 'reserve'
      AND mr.status IN ('pending', 'accepted')
      AND mr.reservation_date IS NOT NULL
      AND mr.reservation_time IS NOT NULL
      AND (p_ignore_request_id IS NULL OR mr.id <> p_ignore_request_id)
      AND (mr.reservation_date::timestamp + mr.reservation_time) < v_new_end
      AND v_new_start < (
        (mr.reservation_date::timestamp + mr.reservation_time)
        + make_interval(mins => GREATEST(COALESCE(mr.reservation_duration_minutes, 60), 1))
      )
  );
END;
$$;

-- 3) Trigger DB pour bloquer les réservations en conflit
CREATE OR REPLACE FUNCTION public.enforce_reservation_slot_no_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_conflict BOOLEAN;
BEGIN
  IF NEW.request_intent = 'reserve'
     AND NEW.status IN ('pending', 'accepted')
     AND NEW.to_user_id IS NOT NULL
     AND NEW.reservation_date IS NOT NULL
     AND NEW.reservation_time IS NOT NULL THEN
    v_conflict := public.check_reservation_slot_conflict(
      NEW.to_user_id,
      NEW.reservation_date,
      NEW.reservation_time,
      COALESCE(NEW.reservation_duration_minutes, 60),
      NEW.id
    );

    IF v_conflict THEN
      RAISE EXCEPTION 'Ce créneau est déjà réservé'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reservation_slot_no_conflict ON public.match_requests;
CREATE TRIGGER trg_enforce_reservation_slot_no_conflict
BEFORE INSERT OR UPDATE ON public.match_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_reservation_slot_no_conflict();

-- 4) Index utile pour la vérification de conflit
CREATE INDEX IF NOT EXISTS idx_match_requests_reservation_slot
  ON public.match_requests (to_user_id, request_intent, status, reservation_date, reservation_time);
