import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthBackground } from '../components/Auth/AuthBackground'
import { PageMeta } from '../components/PageMeta'
import './Auth.css'

const LEGAL_PAGE_FOR_CONDITIONS = '/profile/legal/politique-confidentialite'

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation(['common'])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // État pour l'acceptation de toutes les conditions
  const [acceptAllConditions, setAcceptAllConditions] = useState(false)

  // Fonction pour valider l'email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const normalizePhone = (value: string): string => value.replace(/\s/g, '')

  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(value)
  }

  // Fonction pour calculer la force du mot de passe
  const getPasswordStrength = (pwd: string) => {
    const hasMinLength = pwd.length >= 8
    const hasNumber = /\d/.test(pwd)
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)

    const criteriaMet = [hasMinLength, hasNumber, hasUpperCase, hasSpecialChar].filter(Boolean).length
    const strength = (criteriaMet / 4) * 100

    let strengthLabel = ''
    let strengthColor = ''

    if (strength === 0) {
      strengthLabel = 'Très faible'
      strengthColor = '#ef4444' // rouge
    } else if (strength <= 25) {
      strengthLabel = 'Faible'
      strengthColor = '#f97316' // orange
    } else if (strength <= 50) {
      strengthLabel = 'Moyen'
      strengthColor = '#eab308' // jaune
    } else if (strength <= 75) {
      strengthLabel = 'Bon'
      strengthColor = '#84cc16' // vert clair
    } else {
      strengthLabel = 'Très sécurisé'
      strengthColor = '#22c55e' // vert foncé
    }

    return {
      hasMinLength,
      hasNumber,
      hasUpperCase,
      hasSpecialChar,
      strength,
      strengthLabel,
      strengthColor,
      isValid: hasMinLength && hasNumber && hasUpperCase && hasSpecialChar
    }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation de l'email
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    // Vérifier que le nom d'utilisateur est rempli
    if (!username.trim()) {
      setError('Le nom d\'utilisateur est obligatoire')
      return
    }

    const cleanedPhone = phone.trim() ? normalizePhone(phone.trim()) : ''
    if (cleanedPhone && !validatePhone(cleanedPhone)) {
      setError('Veuillez saisir un numéro de téléphone valide (format international)')
      return
    }

    // Validation du mot de passe
    if (!passwordStrength.isValid) {
      setError('Le mot de passe ne respecte pas tous les critères requis')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    // Vérifier que toutes les conditions sont acceptées
    if (!acceptAllConditions) {
      setError('Veuillez accepter toutes les conditions pour créer un compte')
      return
    }

    setLoading(true)

    try {
      // Créer le compte avec les métadonnées pour le trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Le trigger crée automatiquement le profil
        // On attend un peu pour laisser le trigger s'exécuter, puis on vérifie
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Vérifier que le profil a été créé (optionnel, pour le debug)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (!profile) {
          // Si le trigger n'a pas fonctionné, créer le profil manuellement
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: profileError } = await (supabase.from('profiles') as any).insert({
            id: authData.user.id,
            email: authData.user.email,
            username: username.trim(),
            phone: cleanedPhone || null,
            phone_verified: false
          })

          if (profileError) {
            console.warn('Le profil n\'a pas pu être créé automatiquement:', profileError)
            // On continue quand même, l'utilisateur pourra créer son profil plus tard
          }
        } else if (cleanedPhone) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('profiles') as any)
            .update({
              phone: cleanedPhone,
              phone_verified: false
            })
            .eq('id', authData.user.id)
        }

        alert('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.')
        navigate('/auth/login')
      }
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de l\'inscription'
      
      if (err instanceof Error) {
        // Vérifier les erreurs réseau spécifiques
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et que l\'URL Supabase est correcte.'
        } else if (err.message.includes('NetworkError') || err.message.includes('network')) {
          errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.'
        } else if (err.message.toLowerCase().includes('already registered')) {
          errorMessage = 'Cet email a déjà un compte'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      console.error('Erreur d\'inscription:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageMeta title={t('common:meta.register.title')} description={t('common:meta.register.description')} />
      <div className="auth-page-wrap">
      <AuthBackground />
      <div className="auth-page">
        <div className="auth-container-wrap">
          <div className="auth-container">
            <div className="auth-header">
            <button
              type="button"
              className="auth-back-button"
              onClick={() => navigate('/auth/login')}
              disabled={loading}
            >
              ← Retour
            </button>
            <h1 className="auth-logo">Ollync</h1>
            <p className="auth-subtitle">Créez votre compte avec email</p>
          </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur *</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jeandupont"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={loading}
              className={email && !validateEmail(email) ? 'input-error' : ''}
            />
            {email && !validateEmail(email) && (
              <span className="input-error-message">Format d'email invalide</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Numéro de téléphone (optionnel)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              disabled={loading}
              className={phone && !validatePhone(normalizePhone(phone)) ? 'input-error' : ''}
            />
            {phone && !validatePhone(normalizePhone(phone)) && (
              <span className="input-error-message">Format international requis</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe *</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className={`password-input ${password && !passwordStrength.isValid ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="password-requirements-note">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (@, !, #, etc.)
            </p>
            
            {/* Barre de force du mot de passe */}
            {password && (
              <div className="password-strength-indicator">
                <div className="password-strength-bar-wrapper">
                  <div
                    className="password-strength-bar"
                    style={{
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.strengthColor
                    }}
                  />
                </div>
                <div className="password-strength-label">
                  <span style={{ color: passwordStrength.strengthColor }}>
                    {passwordStrength.strengthLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Bloc Conditions obligatoires - une seule fois en bas après le remplissage */}
          <div className="conditions-block">
            <div className="condition-item">
              <label className="condition-label">
                <input
                  type="checkbox"
                  checked={acceptAllConditions}
                  onChange={(e) => setAcceptAllConditions(e.target.checked)}
                  disabled={loading}
                  className="condition-checkbox"
                />
                <span className="condition-text">
                  J&apos;accepte les CGU, la Politique de confidentialité, les CGV et les Mentions légales
                </span>
              </label>
              <button
                type="button"
                className="condition-more-btn"
                onClick={() =>
                  navigate(LEGAL_PAGE_FOR_CONDITIONS, {
                    state: { fromConsentLearnMore: true, returnTo: location.pathname || '/auth/register' }
                  })
                }
                disabled={loading}
              >
                Voir plus
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={
              loading || 
              !email.trim() ||
              !validateEmail(email) ||
              !username.trim() ||
              !password ||
              !passwordStrength.isValid ||
              password !== confirmPassword
            }
          >
            {loading ? (
              <>
                <Loader className="spinner" size={20} />
                Création...
              </>
            ) : (
              'Créer un compte'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Déjà un compte ?{' '}
            <Link to="/auth/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Register

