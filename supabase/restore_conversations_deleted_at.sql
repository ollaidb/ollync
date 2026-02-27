-- ============================================
-- RESTAURER DES CONVERSATIONS MARQUÉES "SUPPRIMÉES" (deleted_at)
-- ============================================
-- Utilisez ce script si des conversations ont disparu après l'exécution de
-- ensure_unique_direct_conversations.sql et que vous souhaitez les réafficher.
--
-- Ce script remet deleted_at = NULL sur les conversations directes qui ont
-- actuellement deleted_at renseigné. Elles réapparaîtront dans la liste des
-- conversations (une par paire d'utilisateurs peut rester en double si
-- ensure_unique avait créé des doublons).
--
-- À exécuter dans le SQL Editor Supabase. Optionnel.

UPDATE public.conversations
SET deleted_at = NULL
WHERE is_group = false
  AND user1_id IS NOT NULL
  AND user2_id IS NOT NULL
  AND deleted_at IS NOT NULL;
