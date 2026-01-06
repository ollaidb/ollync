import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

const Register = () => {
  const navigate = useNavigate()
  const [authMethod, setAuthMethod] = useState<'choice' | 'email'>('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
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
            full_name: fullName || null,
            username: username || null
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
            full_name: fullName || null,
            username: username || null
          })

          if (profileError) {
            console.warn('Le profil n\'a pas pu être créé automatiquement:', profileError)
            // On continue quand même, l'utilisateur pourra créer son profil plus tard
          }
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

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      })

      if (authError) throw authError
    } catch (err: unknown) {
      let errorMessage = 'Erreur de connexion avec Google'
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      console.error('Erreur de connexion Google:', err)
      setLoading(false)
    }
  }

  const handleAppleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      })

      if (authError) throw authError
    } catch (err: unknown) {
      let errorMessage = 'Erreur de connexion avec Apple'
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      console.error('Erreur de connexion Apple:', err)
      setLoading(false)
    }
  }

  if (authMethod === 'choice') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-logo">Ollync</h1>
            <p className="auth-subtitle">Créez votre compte</p>
          </div>

          <div className="auth-method-choice">
            <button
              type="button"
              className="auth-method-button"
              onClick={() => setAuthMethod('email')}
              disabled={loading}
            >
              <svg className="auth-method-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>S'inscrire avec email</span>
            </button>

            <div className="auth-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="auth-button-google"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              S'inscrire avec Google
            </button>

            <button
              type="button"
              className="auth-button-apple"
              onClick={handleAppleSignup}
              disabled={loading}
            >
              <svg className="apple-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              S'inscrire avec Apple
            </button>
          </div>

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
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <button
            type="button"
            className="auth-back-button"
            onClick={() => {
              setAuthMethod('choice')
              setError('')
            }}
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
            <label htmlFor="fullName">Nom complet (optionnel)</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Dupont"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur (optionnel)</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jeandupont"
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
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
  )
}

export default Register

