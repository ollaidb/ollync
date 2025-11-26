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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else if (data) {
      setProfile({
        username: data.username || '',
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        avatar_url: data.avatar_url || ''
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil')
    } else {
      alert('Profil mis à jour avec succès')
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

