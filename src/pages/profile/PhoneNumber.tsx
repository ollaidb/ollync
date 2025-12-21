import { useState, useEffect } from 'react'
import { Phone, CheckCircle, XCircle, Send, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './PhoneNumber.css'

const PhoneNumber = () => {
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [currentPhone, setCurrentPhone] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  useEffect(() => {
    if (user) {
      fetchPhoneStatus()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchPhoneStatus = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching phone:', error)
      } else if (data) {
        setCurrentPhone((data as any).phone)
        setPhone((data as any).phone || '')
        setIsVerified((data as any).phone_verified || false)
      }
    } catch (error) {
      console.error('Error in fetchPhoneStatus:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Vous devez être connecté' })
      return
    }

    if (!phone || phone.trim() === '') {
      setMessage({ type: 'error', text: 'Veuillez saisir un numéro de téléphone' })
      return
    }

    // Validation basique du numéro (format international)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    const cleanedPhone = phone.replace(/\s/g, '')
    if (!phoneRegex.test(cleanedPhone)) {
      setMessage({ type: 'error', text: 'Veuillez saisir un numéro de téléphone valide (format international)' })
      return
    }

    setSaving(true)
    setMessage({ type: null, text: '' })

    try {
      // Mettre à jour le numéro dans le profil
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({ 
          phone: cleanedPhone,
          phone_verified: false, // Réinitialiser la vérification si le numéro change
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating phone:', updateError)
        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du numéro' })
        setSaving(false)
        return
      }

      setCurrentPhone(cleanedPhone)
      setPhone(cleanedPhone)
      setIsVerified(false)
      setMessage({ type: 'success', text: 'Numéro enregistré. Un code de vérification va être envoyé.' })
      
      // Envoyer le code OTP
      await sendOTP(cleanedPhone)
    } catch (error) {
      console.error('Error in handleSave:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du numéro' })
    } finally {
      setSaving(false)
    }
  }

  const sendOTP = async (phoneNumber: string) => {
    setVerifying(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
      })

      if (error) {
        console.error('Error sending OTP:', error)
        setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du code. Vérifiez votre numéro.' })
      } else {
        setShowVerification(true)
        setMessage({ type: 'success', text: 'Code de vérification envoyé par SMS' })
      }
    } catch (error) {
      console.error('Error in sendOTP:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du code' })
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (!currentPhone) return
    await sendOTP(currentPhone)
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || !currentPhone || !user) {
      setMessage({ type: 'error', text: 'Veuillez saisir le code de vérification' })
      return
    }

    setVerifying(true)
    setMessage({ type: null, text: '' })

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: currentPhone,
        token: otpCode,
        type: 'sms'
      })

      if (error) {
        console.error('Error verifying OTP:', error)
        setMessage({ type: 'error', text: 'Code incorrect. Veuillez réessayer.' })
      } else {
        // Mettre à jour le statut de vérification
        const { error: updateError } = await (supabase.from('profiles') as any)
          .update({ 
            phone_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating verification status:', updateError)
        }

        setIsVerified(true)
        setShowVerification(false)
        setOtpCode('')
        setMessage({ type: 'success', text: 'Numéro de téléphone vérifié avec succès !' })
      }
    } catch (error) {
      console.error('Error in handleVerifyOTP:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la vérification' })
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Numéro de téléphone" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Numéro de téléphone" />
      <div className="page-content phone-number-page">
        <div className="phone-number-container">
          {/* Statut actuel */}
          {currentPhone && (
            <div className="phone-status-section">
              <h3 className="phone-section-title">Numéro actuel</h3>
              <div className="phone-status-card">
                <Phone size={20} />
                <div className="phone-status-info">
                  <span className="phone-number-display">{currentPhone}</span>
                  <div className={`phone-verification-status ${isVerified ? 'verified' : 'pending'}`}>
                    {isVerified ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Confirmé</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        <span>Non confirmé</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div className="phone-form-section">
            <h3 className="phone-section-title">
              {currentPhone ? 'Modifier le numéro' : 'Ajouter un numéro de téléphone'}
            </h3>
            <div className="phone-form">
              <div className="phone-input-group">
                <label htmlFor="phone-input">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="phone-input"
                  className="phone-input"
                  placeholder="+33 6 12 34 56 78"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setMessage({ type: null, text: '' })
                  }}
                  disabled={saving}
                />
                <small className="phone-hint">Format international (ex: +33 6 12 34 56 78)</small>
              </div>

              <button
                className="phone-save-button"
                onClick={handleSave}
                disabled={saving || !phone.trim()}
              >
                {saving ? (
                  <>
                    <Loader size={18} className="spinning" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>{currentPhone ? 'Modifier' : 'Enregistrer'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Vérification OTP */}
          {showVerification && !isVerified && (
            <div className="phone-verification-section">
              <h3 className="phone-section-title">Vérification</h3>
              <div className="phone-verification-form">
                <p className="phone-verification-text">
                  Un code de vérification a été envoyé au {currentPhone}. 
                  Entrez le code reçu par SMS.
                </p>
                <div className="phone-otp-group">
                  <input
                    type="text"
                    className="phone-otp-input"
                    placeholder="Code à 6 chiffres"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setMessage({ type: null, text: '' })
                    }}
                    maxLength={6}
                    disabled={verifying}
                  />
                  <button
                    className="phone-verify-button"
                    onClick={handleVerifyOTP}
                    disabled={verifying || otpCode.length !== 6}
                  >
                    {verifying ? (
                      <>
                        <Loader size={16} className="spinning" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      'Vérifier'
                    )}
                  </button>
                </div>
                <button
                  className="phone-resend-button"
                  onClick={handleResendOTP}
                  disabled={verifying}
                >
                  Renvoyer le code
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {message.text && (
            <div className={`phone-message ${message.type}`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhoneNumber

