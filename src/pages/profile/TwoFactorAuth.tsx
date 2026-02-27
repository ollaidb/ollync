import { useState, useEffect } from 'react'
import { KeyRound, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './TwoFactorAuth.css'

const TwoFactorAuth = () => {
  const { user } = useAuth()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableMethods, setAvailableMethods] = useState({
    phone: { available: false, verified: false },
    email: { available: false, verified: false }
  })

  useEffect(() => {
    if (user) {
      fetchTwoFactorStatus()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchTwoFactorStatus intentionally excluded
  }, [user])

  const fetchTwoFactorStatus = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les informations du profil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, phone_verified, two_factor_enabled')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      } else if (profile) {
        const profileData = profile as { phone?: string; phone_verified?: boolean; two_factor_enabled?: boolean }
        setTwoFactorEnabled(profileData.two_factor_enabled || false)
        setAvailableMethods({
          phone: {
            available: !!profileData.phone,
            verified: profileData.phone_verified || false
          },
          email: {
            available: !!user.email,
            verified: !!user.email_confirmed_at
          }
        })
      }
    } catch (error) {
      console.error('Error in fetchTwoFactorStatus:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTwoFactor = async () => {
    if (!user) return

    // Vérifier qu'au moins une méthode est disponible et vérifiée
    const hasVerifiedMethod = availableMethods.phone.verified || availableMethods.email.verified

    if (!hasVerifiedMethod && !twoFactorEnabled) {
      alert('Ajoutez et confirmez un numéro de téléphone ou un e-mail pour activer la connexion à deux étapes.')
      return
    }

    const newStatus = !twoFactorEnabled
    setTwoFactorEnabled(newStatus)

    try {
      const { error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({ 
          two_factor_enabled: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating two-factor:', error)
        setTwoFactorEnabled(!newStatus)
        alert('Erreur lors de la mise à jour de la connexion à deux étapes')
      }
    } catch (error) {
      console.error('Error in toggleTwoFactor:', error)
      setTwoFactorEnabled(!newStatus)
      alert('Erreur lors de la mise à jour de la connexion à deux étapes')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  const hasVerifiedMethod = availableMethods.phone.verified || availableMethods.email.verified
  const canEnable = hasVerifiedMethod || twoFactorEnabled

  return (
    <div className="page">
      <div className="page-content two-factor-page">
        <div className="two-factor-container">
          <div className="two-factor-section">
            <div className="two-factor-header">
              <div className="two-factor-info">
                <KeyRound size={24} className="two-factor-icon" />
                <div className="two-factor-text">
                  <h3 className="two-factor-title">Connexion à deux étapes</h3>
                  <p className="two-factor-description">
                    Ajoutez une couche de sécurité supplémentaire à votre compte. 
                    Vous devrez confirmer votre identité avec un code lors de la connexion.
                  </p>
                </div>
              </div>
              <label className="two-factor-toggle">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={toggleTwoFactor}
                  disabled={!canEnable}
                />
                <span className="two-factor-toggle-slider"></span>
              </label>
            </div>

            {!hasVerifiedMethod && !twoFactorEnabled && (
              <div className="two-factor-warning">
                <AlertCircle size={18} />
                <p>
                  Ajoutez et confirmez un numéro de téléphone ou un e-mail pour activer 
                  la connexion à deux étapes.
                </p>
              </div>
            )}
          </div>

          <div className="two-factor-methods-section">
            <h3 className="two-factor-methods-title">Méthodes disponibles</h3>
            <div className="two-factor-methods-list">
              <div className={`two-factor-method ${availableMethods.phone.verified ? 'verified' : 'unverified'}`}>
                <div className="two-factor-method-icon">
                  <Phone size={20} />
                </div>
                <div className="two-factor-method-info">
                  <span className="two-factor-method-label">Numéro de téléphone</span>
                  <span className="two-factor-method-status">
                    {availableMethods.phone.verified ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Confirmé</span>
                      </>
                    ) : availableMethods.phone.available ? (
                      <>
                        <XCircle size={14} />
                        <span>Non confirmé</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Non ajouté</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className={`two-factor-method ${availableMethods.email.verified ? 'verified' : 'unverified'}`}>
                <div className="two-factor-method-icon">
                  <Mail size={20} />
                </div>
                <div className="two-factor-method-info">
                  <span className="two-factor-method-label">Adresse e-mail</span>
                  <span className="two-factor-method-status">
                    {availableMethods.email.verified ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Confirmé</span>
                      </>
                    ) : availableMethods.email.available ? (
                      <>
                        <XCircle size={14} />
                        <span>Non confirmé</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Non ajouté</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {twoFactorEnabled && (
            <div className="two-factor-info-section">
              <p className="two-factor-info-text">
                <strong>Connexion à deux étapes activée</strong>
                <br />
                Lors de votre prochaine connexion, vous recevrez un code de vérification 
                sur {availableMethods.phone.verified ? 'votre téléphone' : 'votre e-mail'}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorAuth

