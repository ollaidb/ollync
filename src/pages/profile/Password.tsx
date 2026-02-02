import { useEffect, useState } from 'react'
import { Lock, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './Password.css'

const Password = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [signOutEverywhere, setSignOutEverywhere] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmPlaceholder, setConfirmPlaceholder] = useState(
    'Confirmation du nouveau mot de passe'
  )
  const passwordRules = [
    {
      id: 'length',
      label: '8 à 20 caractères',
      test: (value: string) => value.length >= 8 && value.length <= 20
    },
    {
      id: 'complexity',
      label: 'Lettres, chiffres et caractères spéciaux',
      test: (value: string) =>
        /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)
    }
  ]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const updatePlaceholder = () => {
      setConfirmPlaceholder(
        media.matches ? 'Confirmation du nouveau…' : 'Confirmation du nouveau mot de passe'
      )
    }

    updatePlaceholder()
    media.addEventListener('change', updatePlaceholder)
    return () => media.removeEventListener('change', updatePlaceholder)
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!user) {
      setError('Vous devez être connecté pour changer votre mot de passe')
      return
    }

    if (!passwords.new || passwords.new.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (passwords.new !== passwords.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    // Vérifier le mot de passe actuel en tentant de se reconnecter
    if (passwords.current && user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current
      })

      if (signInError) {
        setError('Mot de passe actuel incorrect')
        setLoading(false)
        return
      }
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwords.new
    })

    if (updateError) {
      setError('Erreur lors de la mise à jour du mot de passe')
      console.error(updateError)
    } else {
      setSuccess('Mot de passe mis à jour avec succès')
      setPasswords({ current: '', new: '', confirm: '' })
      if (signOutEverywhere) {
        await supabase.auth.signOut({ scope: 'global' })
        window.location.href = '/auth/login'
        return
      }
    }

    setLoading(false)
  }

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Mot de passe" />
        <div className="page-content password-page">
          <div className="password-container">
            <div className="empty-state">
              <Lock size={64} />
              <h2>Connexion requise</h2>
              <p>Connectez-vous pour modifier votre mot de passe</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Mot de passe" />
      <div className="page-content password-page">
        <div className="password-container">
          <div className="password-form-section">
            <form className="password-form" onSubmit={handlePasswordChange}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="password-info">
                <div className="password-info-icon">
                  <ShieldCheck size={28} />
                </div>
                <p className="password-info-text">
                  Pour votre sécurité, choisissez un mot de passe fiable que vous n’utilisez pas ailleurs.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="current-password">
                  Mot de passe actuel *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="current-password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="Mot de passe actuel"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">
                  Nouveau mot de passe *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="Nouveau mot de passe"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">
                  Confirmation du nouveau mot de passe *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder={confirmPlaceholder}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="password-rules">
                <span className="password-rules-title">
                  Votre mot de passe doit contenir :
                </span>
                <ul className="password-rules-list">
                  {passwordRules.map((rule) => {
                    const isMet = rule.test(passwords.new)
                    return (
                      <li
                        key={rule.id}
                        className={`password-rule ${isMet ? 'met' : ''}`}
                      >
                        <span className="password-rule-dot" />
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="password-signout-option">
                <span>Déconnecter partout où je suis connecté avec mon ancien mot de passe</span>
                <label className="password-checkbox">
                  <input
                    type="checkbox"
                    checked={signOutEverywhere}
                    onChange={(e) => setSignOutEverywhere(e.target.checked)}
                  />
                  <span className="password-checkbox-box"></span>
                </label>
              </div>

              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Mise à jour...' : 'Modifier mon mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Password

