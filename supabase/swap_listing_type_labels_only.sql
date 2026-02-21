-- Swap Offre/Demande naming WITHOUT moving business logic.
-- Recommended: do NOT update posts.listing_type values.
-- The app labels are swapped in UI (offer -> "Demande", request -> "Offre").

-- 1) Verification: current distribution
SELECT listing_type, COUNT(*) AS total
FROM public.posts
GROUP BY listing_type
ORDER BY listing_type;

-- 2) Optional data swap (ONLY if you explicitly want to invert stored values too)
-- WARNING:
-- If you run this block, you must also keep app logic aligned, otherwise behavior changes.
--
-- BEGIN;
-- UPDATE public.posts
-- SET listing_type = CASE
--   WHEN listing_type = 'offer' THEN 'request'
--   WHEN listing_type = 'request' THEN 'offer'
--   ELSE listing_type
-- END
-- WHERE listing_type IN ('offer', 'request');
-- COMMIT;

