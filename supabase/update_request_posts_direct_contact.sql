-- =====================================================
-- MIGRATION: ANNONCES "DEMANDE" => CONTACT DIRECT
-- =====================================================
-- Objectif:
-- 1) Nettoyer les anciennes demandes en attente pour les posts en mode "request"
-- 2) Garder un historique cohérent avec le nouveau flux (contact direct via messagerie)

-- 1) Annuler les match_requests encore en attente sur les annonces de type demande
UPDATE match_requests mr
SET
  status = 'cancelled',
  updated_at = NOW()
FROM posts p
WHERE mr.related_post_id = p.id
  AND p.listing_type = 'request'
  AND mr.status = 'pending';

-- 2) Vérification rapide
SELECT
  p.id AS post_id,
  p.title,
  p.listing_type,
  mr.status,
  COUNT(*) AS total
FROM match_requests mr
JOIN posts p ON p.id = mr.related_post_id
WHERE p.listing_type = 'request'
GROUP BY p.id, p.title, p.listing_type, mr.status
ORDER BY p.title, mr.status;
