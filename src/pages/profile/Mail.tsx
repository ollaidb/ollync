import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail as MailIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './Mail.css'

const Mail = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [newEmail, setNewEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  useEffect(() => {
    if (user) {
      setCurrentEmail(user.email || '')
      // Vérifier si l'e-mail est confirmé
      setEmailConfirmed(user.email_confirmed_at !== null)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Vous devez être connecté' })
      return
    }

    if (!newEmail || newEmail.trim() === '') {
      setMessage({ type: 'error', text: 'Veuillez saisir un nouvel e-mail' })
      return
    }

    // Validation basique de l'e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setMessage({ type: 'error', text: 'Veuillez saisir une adresse e-mail valide' })
      return
    }

    if (newEmail === currentEmail) {
      setMessage({ type: 'error', text: 'Le nouvel e-mail est identique à l\'e-mail actuel' })
      return
    }

    setLoading(true)
    setMessage({ type: null, text: '' })

    try {
      // Mettre à jour l'e-mail dans Supabase Auth
      // Supabase enverra automatiquement un e-mail de confirmation
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        console.error('Error updating email:', error)
        setMessage({ 
          type: 'error', 
          text: error.message || 'Erreur lors de la mise à jour de l\'e-mail' 
        })
        setLoading(false)
        return
      }

      // Succès - afficher le message de confirmation
      setMessage({ 
        type: 'success', 
        text: 'Un e-mail de confirmation a été envoyé. Vérifiez votre boîte mail.' 
      })
      setNewEmail('')
      
      // Mettre à jour l'e-mail affiché (même si pas encore confirmé)
      setCurrentEmail(newEmail)
      setEmailConfirmed(false)
    } catch (error) {
      console.error('Error in handleSave:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de l\'e-mail' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Mail" />
      <div className="page-content mail-page">
        <div className="mail-container">
          <div className="mail-section">
            <h3 className="mail-section-title">E-mail actuel</h3>
            <div className="mail-current">
              <div className="mail-current-info">
                <MailIcon size={18} />
                <span className="mail-current-email">{currentEmail || 'Aucun e-mail'}</span>
              </div>
              {currentEmail && (
                <div className={`mail-status ${emailConfirmed ? 'confirmed' : 'pending'}`}>
                  {emailConfirmed ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Confirmé</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      <span>En attente de confirmation</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mail-section">
            <h3 className="mail-section-title">Nouvel e-mail</h3>
            <div className="mail-form">
              <input
                type="email"
                className="mail-input"
                placeholder="nouveau@email.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  setMessage({ type: null, text: '' })
                }}
                disabled={loading}
              />
              <button
                className="mail-button"
                onClick={handleSave}
                disabled={loading || !newEmail.trim()}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`mail-message ${message.type}`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="mail-info">
            <p>
              <strong>Important :</strong> Après avoir changé votre e-mail, vous recevrez un e-mail de confirmation 
              à la nouvelle adresse. Votre nouvel e-mail ne sera actif qu'après confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Mail

