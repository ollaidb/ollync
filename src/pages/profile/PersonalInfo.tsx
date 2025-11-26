import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, FileText, Save } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './PersonalInfo.css'

const PersonalInfo = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Récupérer les données depuis auth.users (source de vérité pour les noms)
    const authFullName = user.user_metadata?.full_name || null
    const authUsername = user.user_metadata?.username || null
    
    // Récupérer les autres données depuis profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    }
    
    // Utiliser les données de auth.users pour les noms, profiles pour le reste
    const profileData = data || {}
    setProfile({
      username: authUsername || (profileData as { username?: string | null }).username || '',
      full_name: authFullName || (profileData as { full_name?: string | null }).full_name || '',
      email: user.email || (profileData as { email?: string | null }).email || '',
      phone: (profileData as { phone?: string | null }).phone || '',
      bio: (profileData as { bio?: string | null }).bio || '',
      location: (profileData as { location?: string | null }).location || '',
      avatar_url: (profileData as { avatar_url?: string | null }).avatar_url || ''
    })
    
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    
    try {
      // 1. Mettre à jour auth.users pour full_name et username (source de vérité)
      // Cela déclenchera automatiquement le trigger qui synchronisera vers profiles
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name || null,
          username: profile.username || null
        }
      })

      if (authError) {
        console.error('Error updating auth user:', authError)
        alert('Erreur lors de la mise à jour des informations d\'authentification')
        setSaving(false)
        return
      }

      // 2. Mettre à jour les autres champs dans profiles (phone, bio, location, avatar_url)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
        alert('Erreur lors de la mise à jour du profil')
      } else {
        alert('Profil mis à jour avec succès')
        // Recharger les données utilisateur pour avoir les dernières valeurs
        const { data: { user: updatedUser } } = await supabase.auth.getUser()
        if (updatedUser) {
          fetchProfile()
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Erreur lors de la mise à jour du profil')
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Informations personnelles" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Informations personnelles" />
        <div className="page-content personal-info-page">
          <div className="personal-info-container">
            <div className="empty-state">
              <User size={64} />
              <h2>Connexion requise</h2>
              <p>Connectez-vous pour modifier vos informations personnelles</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Informations personnelles" />
      <div className="page-content personal-info-page">
        <div className="personal-info-container">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Votre nom d'utilisateur"
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Nom complet</label>
              <input
                type="text"
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <Phone size={16} />
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={16} />
                Adresse
              </label>
              <input
                type="text"
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ville, Pays"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">
                <FileText size={16} />
                Bio
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous..."
                rows={4}
              />
            </div>

            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfo

