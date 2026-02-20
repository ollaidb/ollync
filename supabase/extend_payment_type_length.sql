-- Fix publish error: "value too long for type character varying(20)"
-- The payment type "visibilite-contre-service" exceeds 20 chars.

ALTER TABLE public.posts
  ALTER COLUMN payment_type TYPE VARCHAR(50);

-- Keep match_requests compatible if payment types are copied there.
ALTER TABLE public.match_requests
  ALTER COLUMN related_service_payment_type TYPE VARCHAR(50);
