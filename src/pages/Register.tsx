import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

const Register = () => {
  const navigate = useNavigate()
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
          const { error: profileError } = await supabase.from('profiles').insert({
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">Ollync</h1>
          <p className="auth-subtitle">Créez votre compte</p>
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

