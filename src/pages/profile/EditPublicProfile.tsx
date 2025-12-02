import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Upload, Camera, Mail, Phone, MapPin, FileText, Instagram, Linkedin, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './EditPublicProfile.css'

const EditPublicProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [profile, setProfile] = useState({
    avatar_url: '',
    username: '',
    full_name: '',
    location: '',
    distance: '',
    bio: '',
    skills: [] as string[],
    services: [] as string[],
    socialLinks: {
      instagram: '',
      tiktok: '',
      linkedin: '',
      twitter: '',
      facebook: '',
      website: ''
    },
    phone: '',
    email: '',
    phone_verified: false,
    email_verified: false
  })
  const [newSkill, setNewSkill] = useState('')
  const [newService, setNewService] = useState('')

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
    
    const profileData = data || {}
    const socialLinks = (profileData as { social_links?: any }).social_links || {}
    
    setProfile({
      avatar_url: (profileData as { avatar_url?: string | null }).avatar_url || '',
      username: authUsername || (profileData as { username?: string | null }).username || '',
      full_name: authFullName || (profileData as { full_name?: string | null }).full_name || '',
      location: (profileData as { location?: string | null }).location || '',
      distance: (profileData as { distance?: string | null }).distance || '',
      bio: (profileData as { bio?: string | null }).bio || '',
      skills: (profileData as { skills?: string[] | null }).skills || [],
      services: (profileData as { services?: string[] | null }).services || [],
      socialLinks: {
        instagram: socialLinks.instagram || '',
        tiktok: socialLinks.tiktok || '',
        linkedin: socialLinks.linkedin || '',
        twitter: socialLinks.twitter || '',
        facebook: socialLinks.facebook || '',
        website: socialLinks.website || ''
      },
      phone: (profileData as { phone?: string | null }).phone || '',
      email: user.email || '',
      phone_verified: (profileData as { phone_verified?: boolean | null }).phone_verified || false,
      email_verified: !!user.email_confirmed_at
    })
    
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5242880) { // 5MB
      alert('L\'image est trop volumineuse (max 5MB)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.')
      return
    }

    setUploadingAvatar(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`
      
      // Supprimer l'ancienne photo si elle existe
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('posts').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        alert('Erreur lors du téléchargement de la photo')
        setUploadingAvatar(false)
        return
      }

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      if (data?.publicUrl) {
        setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }))
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Erreur lors du téléchargement de la photo')
    }

    setUploadingAvatar(false)
  }

  const handleSendPhoneVerification = async () => {
    if (!profile.phone || !user) return

    setVerifyingPhone(true)
    try {
      // Envoyer le code OTP via Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: profile.phone
      })

      if (error) {
        console.error('Error sending OTP:', error)
        alert('Erreur lors de l\'envoi du code. Vérifiez votre numéro de téléphone.')
      } else {
        setShowPhoneVerification(true)
        alert('Code de vérification envoyé par SMS')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert('Erreur lors de l\'envoi du code')
    }
    setVerifyingPhone(false)
  }

  const handleVerifyPhoneCode = async () => {
    if (!phoneCode || !profile.phone || !user) return

    setVerifyingPhone(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: profile.phone,
        token: phoneCode,
        type: 'sms'
      })

      if (error) {
        console.error('Error verifying OTP:', error)
        alert('Code incorrect. Veuillez réessayer.')
      } else {
        setProfile(prev => ({ ...prev, phone_verified: true }))
        setShowPhoneVerification(false)
        setPhoneCode('')
        alert('Numéro de téléphone vérifié avec succès!')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      alert('Erreur lors de la vérification')
    }
    setVerifyingPhone(false)
  }

  const handleResendEmailVerification = async () => {
    if (!user?.email) return

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) {
        console.error('Error resending email:', error)
        alert('Erreur lors de l\'envoi de l\'email de vérification')
      } else {
        alert('Email de vérification envoyé! Vérifiez votre boîte de réception.')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Erreur lors de l\'envoi de l\'email')
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const handleAddService = () => {
    if (newService.trim() && !profile.services.includes(newService.trim())) {
      setProfile(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }))
      setNewService('')
    }
  }

  const handleRemoveService = (service: string) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    
    try {
      // 1. Mettre à jour auth.users pour full_name et username
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

      // 2. Mettre à jour les autres champs dans profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          email: profile.email,
          phone: profile.phone || null,
          bio: profile.bio || null,
          location: profile.location || null,
          distance: profile.distance || null,
          avatar_url: profile.avatar_url || null,
          skills: profile.skills.length > 0 ? profile.skills : null,
          services: profile.services.length > 0 ? profile.services : null,
          social_links: profile.socialLinks,
          phone_verified: profile.phone_verified,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
        alert('Erreur lors de la mise à jour du profil')
      } else {
        navigate('/profile/public')
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
        <PageHeader title="Éditer le profil" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Éditer le profil" />
        <div className="page-content edit-public-profile-page">
          <div className="edit-public-profile-container">
            <div className="empty-state">
              <p>Connexion requise</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Éditer le profil" />
      <div className="page-content edit-public-profile-page">
        <div className="edit-public-profile-container">
          <div className="form-section">
            {/* Photo de profil */}
            <div className="form-group">
              <label>Photo de profil</label>
              <div className="avatar-upload-section">
                <div className="avatar-preview">
                  <img
                    src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'User')}`}
                    alt="Avatar"
                    className="avatar-preview-image"
                  />
                  {uploadingAvatar && (
                    <div className="avatar-upload-overlay">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="avatar-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera size={18} />
                  {uploadingAvatar ? 'Téléchargement...' : 'Modifier la photo'}
                </button>
              </div>
            </div>

            {/* Nom / Pseudo */}
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
              <label htmlFor="username">Nom d'utilisateur / Pseudo</label>
              <input
                type="text"
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Votre pseudo"
              />
            </div>

            {/* Localisation */}
            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={16} />
                Localisation (Ville)
              </label>
              <input
                type="text"
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Paris, France"
              />
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distance (rayon de recherche)</label>
              <select
                id="distance"
                value={profile.distance}
                onChange={(e) => setProfile(prev => ({ ...prev, distance: e.target.value }))}
              >
                <option value="">Sélectionner</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="unlimited">Illimité</option>
              </select>
            </div>

            {/* Bio & Description */}
            <div className="form-group">
              <label htmlFor="bio">
                <FileText size={16} />
                Bio & Description
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous en quelques mots..."
                rows={4}
                maxLength={500}
              />
              <div className="char-count">{profile.bio.length}/500</div>
            </div>

            {/* Compétences */}
            <div className="form-group">
              <label>Compétences & Capacités</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="tag">
                      {skill}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                    placeholder="Ajouter une compétence"
                  />
                  <button
                    type="button"
                    className="tag-add-button"
                    onClick={handleAddSkill}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="form-group">
              <label>Services</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {profile.services.map((service, index) => (
                    <span key={index} className="tag">
                      {service}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveService(service)}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddService()
                      }
                    }}
                    placeholder="Ajouter un service"
                  />
                  <button
                    type="button"
                    className="tag-add-button"
                    onClick={handleAddService}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Liens sociaux */}
            <div className="form-group">
              <label className="section-label">Liens sociaux / Réseaux</label>
              <div className="social-links-grid">
                <div className="social-link-item">
                  <Instagram size={18} />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={profile.socialLinks.instagram}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                  />
                </div>
                <div className="social-link-item">
                  <Linkedin size={18} />
                  <input
                    type="text"
                    placeholder="LinkedIn"
                    value={profile.socialLinks.linkedin}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                  />
                </div>
                <div className="social-link-item">
                  <Globe size={18} />
                  <input
                    type="text"
                    placeholder="TikTok"
                    value={profile.socialLinks.tiktok}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                    }))}
                  />
                </div>
                <div className="social-link-item">
                  <Globe size={18} />
                  <input
                    type="text"
                    placeholder="Twitter/X"
                    value={profile.socialLinks.twitter}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                  />
                </div>
                <div className="social-link-item">
                  <Globe size={18} />
                  <input
                    type="text"
                    placeholder="Facebook"
                    value={profile.socialLinks.facebook}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                    }))}
                  />
                </div>
                <div className="social-link-item">
                  <Globe size={18} />
                  <input
                    type="text"
                    placeholder="Site web"
                    value={profile.socialLinks.website}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Vérifications & Sécurité */}
            <div className="form-group">
              <label className="section-label">Vérifications & Sécurité</label>
              
              {/* Email */}
              <div className="verification-item">
                <div className="verification-header">
                  <div className="verification-info">
                    <Mail size={18} />
                    <div>
                      <div className="verification-label">Email</div>
                      <div className="verification-value">{profile.email}</div>
                    </div>
                  </div>
                  {profile.email_verified ? (
                    <div className="verification-badge verified">
                      <CheckCircle2 size={16} />
                      <span>Vérifié</span>
                    </div>
                  ) : (
                    <div className="verification-badge not-verified">
                      <AlertCircle size={16} />
                      <span>Non vérifié</span>
                    </div>
                  )}
                </div>
                {!profile.email_verified && (
                  <button
                    type="button"
                    className="verification-button"
                    onClick={handleResendEmailVerification}
                  >
                    Renvoyer l'email de vérification
                  </button>
                )}
              </div>

              {/* Téléphone */}
              <div className="verification-item">
                <div className="verification-header">
                  <div className="verification-info">
                    <Phone size={18} />
                    <div>
                      <div className="verification-label">Numéro de téléphone</div>
                      <input
                        type="tel"
                        className="verification-input"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                  {profile.phone_verified ? (
                    <div className="verification-badge verified">
                      <CheckCircle2 size={16} />
                      <span>Vérifié</span>
                    </div>
                  ) : (
                    <div className="verification-badge not-verified">
                      <AlertCircle size={16} />
                      <span>Non vérifié</span>
                    </div>
                  )}
                </div>
                {!profile.phone_verified && profile.phone && (
                  <div className="phone-verification-section">
                    {!showPhoneVerification ? (
                      <button
                        type="button"
                        className="verification-button"
                        onClick={handleSendPhoneVerification}
                        disabled={verifyingPhone}
                      >
                        {verifyingPhone ? 'Envoi...' : 'Envoyer le code SMS'}
                      </button>
                    ) : (
                      <div className="phone-code-input">
                        <input
                          type="text"
                          placeholder="Code de vérification"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          maxLength={6}
                        />
                        <button
                          type="button"
                          className="verify-code-button"
                          onClick={handleVerifyPhoneCode}
                          disabled={verifyingPhone || !phoneCode}
                        >
                          {verifyingPhone ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => navigate('/profile/public')}
              >
                Annuler
              </button>
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
    </div>
  )
}

export default EditPublicProfile
