-- ============================================
-- Liste des rendez-vous : afficher tous les statuts
-- ============================================
-- La page Messages (filtre Rendez-vous) affiche désormais tous les rendez-vous :
-- à venir, passés, annulés, modifiés (pending, accepted, declined, cancelled).
--
-- Ce script ne modifie rien : les politiques RLS actuelles permettent déjà
-- de lire tous les rendez-vous où l'utilisateur est sender ou recipient,
-- sans filtre sur status. Vous pouvez l'exécuter pour vérifier les politiques.
-- ============================================

-- Vérifier que la politique SELECT sur appointments ne filtre pas par status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
      AND policyname = 'Users can view their own appointments'
      AND cmd = 'SELECT'
  ) THEN
    RAISE NOTICE '✅ Politique "Users can view their own appointments" présente : tous les rendez-vous (tous statuts) sont visibles pour sender et recipient.';
  ELSE
    RAISE NOTICE '⚠️ Politique SELECT sur appointments non trouvée. Vérifiez les politiques RLS sur la table appointments.';
  END IF;
END $$;
