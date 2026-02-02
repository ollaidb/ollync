import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './DeleteAccount.css'

const DeleteAccount = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer votre compte')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      // Appeler la fonction RPC SQL pour supprimer le compte
      // Cette fonction utilise SECURITY DEFINER pour avoir les privilèges nécessaires
      // La suppression dans auth.users déclenchera automatiquement la suppression
      // en cascade du profil et de toutes les données associées
      const { error: rpcError } = await supabase.rpc('delete_user_account')

      if (rpcError) {
        // Si la fonction RPC n'existe pas, essayer une approche alternative
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
          throw new Error(
            'La fonction de suppression de compte n\'est pas encore configurée. ' +
            'Veuillez exécuter le script SQL create_delete_account_function.sql dans le SQL Editor de Supabase.'
          )
        }
        throw rpcError
      }

      // La suppression a réussi, déconnecter l'utilisateur
      await signOut()

      // Rediriger vers la page d'accueil
      navigate('/home')
      
      // Recharger la page pour s'assurer que tous les états sont réinitialisés
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (err) {
      console.error('Error deleting account:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer.'
      setError(errorMessage)
      setIsDeleting(false)
    }
  }

  if (!isConfirming) {
    return (
      <div className="page">
        <div className="page-content delete-account-page">
          <div className="delete-account-container">
            <div className="delete-account-warning">
              <div className="delete-account-warning-icon">
                <AlertTriangle size={48} />
              </div>
              <h2 className="delete-account-warning-title">
                Souhaitez-vous vraiment supprimer votre compte ?
              </h2>
              <p className="delete-account-warning-text">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
            </div>

            <div className="delete-account-details">
              <h3 className="delete-account-details-title">Voici ce qui sera supprimé :</h3>
              <ul className="delete-account-details-list">
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Votre compte et profil utilisateur</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Toutes vos publications et annonces</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Tous vos commentaires et interactions</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Vos messages et conversations</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Vos favoris et likes</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Vos abonnements et followers</span>
                </li>
                <li className="delete-account-details-item">
                  <span className="delete-account-details-icon">•</span>
                  <span>Toutes vos autres données personnelles</span>
                </li>
              </ul>
            </div>

            <div className="delete-account-note">
              <p>
                <strong>Important :</strong> Une fois votre compte supprimé, toutes vos traces sur la plateforme disparaîtront. 
                Vous devrez créer un nouveau compte si vous souhaitez utiliser à nouveau l'application.
              </p>
            </div>

            {error && (
              <div className="delete-account-error">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="delete-account-actions">
              <button
                className="delete-account-cancel-btn"
                onClick={() => navigate('/profile/settings')}
              >
                Annuler
              </button>
              <button
                className="delete-account-confirm-btn"
                onClick={() => setIsConfirming(true)}
              >
                <Trash2 size={18} />
                <span>Supprimer mon compte</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content delete-account-page">
        <div className="delete-account-container">
          <div className="delete-account-confirmation">
            <div className="delete-account-confirmation-icon">
              <AlertTriangle size={64} />
            </div>
            <h2 className="delete-account-confirmation-title">
              Dernière confirmation
            </h2>
            <p className="delete-account-confirmation-text">
              Êtes-vous absolument sûr de vouloir supprimer définitivement votre compte ?
            </p>
            <p className="delete-account-confirmation-subtext">
              Cette action ne peut pas être annulée. Toutes vos données seront perdues à jamais.
            </p>

            {error && (
              <div className="delete-account-error">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="delete-account-confirmation-actions">
              <button
                className="delete-account-cancel-btn"
                onClick={() => {
                  setIsConfirming(false)
                  setError(null)
                }}
                disabled={isDeleting}
              >
                <X size={18} />
                <span>Annuler</span>
              </button>
              <button
                className="delete-account-final-btn"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="delete-account-spinner"></div>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    <span>Oui, supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccount

