import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthBackground } from '../components/Auth/AuthBackground'
import './Auth.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'request' | 'update'>('request')
  const [passwords, setPasswords] = useState({ new: '', confirm: '' })

  const emailFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('email') || ''
  }, [location.search])

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery)
    }
  }, [emailFromQuery])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace('#', ''))
    const hasRecovery =
      searchParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      searchParams.has('access_token') ||
      hashParams.has('access_token') ||
      searchParams.has('code')

    if (hasRecovery) {
      setMode('update')
    }
  }, [location.hash, location.search])

  useEffect(() => {
    const exchangeCode = async () => {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      if (!code) return

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError('Le lien de réinitialisation est invalide ou expiré.')
      }
    }

    exchangeCode()
  }, [location.search])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (resetError) {
        throw resetError
      }

      setSuccess('Un lien de réinitialisation a été envoyé à votre adresse email.')
    } catch (err: unknown) {
      let errorMessage = 'Impossible d\'envoyer le lien de réinitialisation.'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwords.new.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (passwords.new !== passwords.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwords.new
    })

    if (updateError) {
      setError('Impossible de mettre à jour le mot de passe.')
      setLoading(false)
      return
    }

    setSuccess('Votre mot de passe a bien été mis à jour.')
    setPasswords({ new: '', confirm: '' })
    setLoading(false)
  }

  return (
    <div className="auth-page-wrap">
      <AuthBackground />
      <div className="auth-page">
        <div className="auth-container-wrap">
          <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">Ollync</h1>
          <p className="auth-subtitle">
            {mode === 'request' ? 'Mot de passe oublié' : 'Définir un nouveau mot de passe'}
          </p>
        </div>

        {mode === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestReset}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spinner" size={20} />
                  Envoi du lien...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleUpdatePassword}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="new-password">Nouveau mot de passe</label>
              <input
                id="new-password"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirmer le mot de passe</label>
              <input
                id="confirm-password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spinner" size={20} />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/auth/login" className="auth-link">
              Retour à la connexion
            </Link>
          </p>
          {success && mode === 'update' && (
            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </button>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
