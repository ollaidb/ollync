import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Camera, MapPin, FileText, Instagram, Linkedin, Globe, Search, Briefcase, Edit2, Plus, DollarSign, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConsent } from '../../hooks/useConsent'
import PageHeader from '../../components/PageHeader'
import ConsentModal from '../../components/ConsentModal'
import { GooglePlacesAutocomplete } from '../../components/Location/GooglePlacesAutocomplete'
import './EditPublicProfile.css'

const EditPublicProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState({
    avatar_url: '',
    username: '',
    full_name: '',
    location: '',
    distance: '',
    bio: '',
    skills: [] as string[],
    services: [] as Array<{
      name: string
      description: string
      payment_type: 'price' | 'exchange'
      value: string
    }>,
    socialLinks: [] as string[],
    phone: '',
    email: '',
    phone_verified: false,
    email_verified: false,
    statuses: [] as Array<{ name: string; description: string }>
  })
  const [newSkill, setNewSkill] = useState('')
  const [newSocialLink, setNewSocialLink] = useState('')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    payment_type: 'price' as 'price' | 'exchange',
    value: ''
  })
  const [statusSearch, setStatusSearch] = useState('')
  const [showStatusSuggestions, setShowStatusSuggestions] = useState(false)
  const [selectedStatusForDescription, setSelectedStatusForDescription] = useState<string | null>(null)
  const [statusDescription, setStatusDescription] = useState('')

  // Hook de consentement pour les données personnelles du profil
  const profileConsent = useConsent('profile_data')

  // Gérer le refus : rediriger vers la page précédente
  const handleRejectConsent = () => {
    profileConsent.handleReject()
    navigate(-1) // Retour à la page précédente
  }

  const fetchProfile = useCallback(async () => {
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
    const socialLinksObj = (profileData as { social_links?: Record<string, string> | null }).social_links || {}
    
    // Convertir l'objet social_links en tableau de chaînes
    const socialLinksArray: string[] = []
    if (socialLinksObj.instagram) socialLinksArray.push(socialLinksObj.instagram)
    if (socialLinksObj.tiktok) socialLinksArray.push(socialLinksObj.tiktok)
    if (socialLinksObj.linkedin) socialLinksArray.push(socialLinksObj.linkedin)
    if (socialLinksObj.twitter) socialLinksArray.push(socialLinksObj.twitter)
    if (socialLinksObj.facebook) socialLinksArray.push(socialLinksObj.facebook)
    if (socialLinksObj.website) socialLinksArray.push(socialLinksObj.website)
    
    setProfile({
      avatar_url: (profileData as { avatar_url?: string | null }).avatar_url || '',
      username: authUsername || (profileData as { username?: string | null }).username || '',
      full_name: authFullName || (profileData as { full_name?: string | null }).full_name || '',
      location: (profileData as { location?: string | null }).location || '',
      distance: (profileData as { distance?: string | null }).distance || '',
      bio: (profileData as { bio?: string | null }).bio || '',
      skills: (profileData as { skills?: string[] | null }).skills || [],
      services: (() => {
        const servicesData = (profileData as { services?: Array<{ name: string; description: string; payment_type: 'price' | 'exchange'; value: string }> | string[] | null }).services
        if (!servicesData) return []
        // Si les services sont encore des strings (ancien format), les convertir
        if (Array.isArray(servicesData) && servicesData.length > 0 && typeof servicesData[0] === 'string') {
          return (servicesData as string[]).map(name => ({
            name,
            description: '',
            payment_type: 'price' as const,
            value: ''
          }))
        }
        return servicesData as Array<{ name: string; description: string; payment_type: 'price' | 'exchange'; value: string }>
      })(),
      socialLinks: socialLinksArray,
      phone: (profileData as { phone?: string | null }).phone || '',
      email: user.email || '',
      phone_verified: (profileData as { phone_verified?: boolean | null }).phone_verified || false,
      email_verified: !!user.email_confirmed_at,
      statuses: (profileData as { statuses?: Array<{ name: string; description: string }> | null }).statuses || []
    })
    
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
    setLoading(false)
  }
  }, [user, fetchProfile])

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

  const handleOpenServiceModal = (index?: number) => {
    if (index !== undefined && index !== null) {
      // Modifier un service existant
      setEditingServiceIndex(index)
      setServiceForm(profile.services[index])
      } else {
      // Ajouter un nouveau service
      setEditingServiceIndex(null)
      setServiceForm({
        name: '',
        description: '',
        payment_type: 'price',
        value: ''
      })
    }
    setShowServiceModal(true)
  }

  const handleCloseServiceModal = () => {
    setShowServiceModal(false)
    setEditingServiceIndex(null)
    setServiceForm({
      name: '',
      description: '',
      payment_type: 'price',
      value: ''
    })
  }

  const handleSaveService = () => {
    if (!serviceForm.name.trim()) {
      alert('Le nom du service est obligatoire')
      return
    }

    if (!serviceForm.payment_type) {
      alert('Le mode de paiement est obligatoire')
      return
    }

    if (!serviceForm.value.trim()) {
      if (serviceForm.payment_type === 'price') {
        alert('Le prix est obligatoire')
      } else {
        alert('La description de l\'échange est obligatoire')
    }
      return
    }

    if (editingServiceIndex !== null) {
      // Modifier un service existant
      setProfile(prev => ({
        ...prev,
        services: prev.services.map((s, i) =>
          i === editingServiceIndex ? {
            name: serviceForm.name.trim(),
            description: serviceForm.description.trim(),
            payment_type: serviceForm.payment_type,
            value: serviceForm.value.trim()
          } : s
        )
      }))
      } else {
      // Ajouter un nouveau service
      setProfile(prev => ({
        ...prev,
        services: [...prev.services, {
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          payment_type: serviceForm.payment_type,
          value: serviceForm.value.trim()
        }]
      }))
    }

    handleCloseServiceModal()
  }

  const handleRemoveService = (index: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      setProfile(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAddSocialLink = () => {
    if (newSocialLink.trim() && !profile.socialLinks.includes(newSocialLink.trim())) {
      setProfile(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, newSocialLink.trim()]
      }))
      setNewSocialLink('')
    }
  }

  const handleRemoveSocialLink = (link: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter(l => l !== link)
    }))
  }

  // Liste de recommandations de statuts basée sur l'application
  const statusRecommendations = [
    'Créateur de contenu',
    'Photographe',
    'Vidéaste',
    'Monteur vidéo',
    'Graphiste',
    'Influenceur',
    'Youtuber',
    'Podcasteur',
    'Blogueur',
    'Community Manager',
    'Stratège en contenu',
    'Réalisateur',
    'Scénariste',
    'Acteur',
    'Modèle',
    'Figurant',
    'Voix off',
    'Motion designer',
    'Web designer',
    'Développeur',
    'Entrepreneur',
    'Coach',
    'Consultant',
    'Freelance',
    'Artiste',
    'Musicien',
    'DJ',
    'Événementiel',
    'Organisateur d\'événements',
    'Journaliste',
    'Rédacteur',
    'Traducteur',
    'Interprète',
    'Formateur',
    'Éducateur',
    'Mentor'
  ]

  // Filtrer les recommandations de statuts selon la recherche
  const filteredStatusRecommendations = statusRecommendations.filter(status =>
    status.toLowerCase().includes(statusSearch.toLowerCase())
  )

  // Ajouter un statut
  const handleAddStatus = (statusName: string) => {
    const trimmedName = statusName.trim()
    if (trimmedName && !profile.statuses.some(s => s.name === trimmedName)) {
      setProfile(prev => ({
        ...prev,
        statuses: [...prev.statuses, { name: trimmedName, description: '' }]
      }))
      setStatusSearch('')
      setShowStatusSuggestions(false)
    }
  }

  // Supprimer un statut
  const handleRemoveStatus = (statusName: string) => {
    setProfile(prev => ({
      ...prev,
      statuses: prev.statuses.filter(s => s.name !== statusName)
    }))
  }

  // Mettre à jour la description d'un statut
  const handleUpdateStatusDescription = (statusName: string, description: string) => {
    setProfile(prev => ({
      ...prev,
      statuses: prev.statuses.map(s =>
        s.name === statusName ? { ...s, description } : s
      )
    }))
  }

  // Détecter le type de réseau social à partir de l'URL
  const detectSocialType = (url: string): { type: string; icon: typeof Instagram | typeof Linkedin | typeof Globe; name: string } => {
    const lowerUrl = url.toLowerCase().trim()
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am') || (lowerUrl.startsWith('@') && !lowerUrl.includes('tiktok'))) {
      return { type: 'instagram', icon: Instagram, name: 'Instagram' }
    }
    if (lowerUrl.includes('tiktok.com') || (lowerUrl.startsWith('@') && lowerUrl.includes('tiktok'))) {
      return { type: 'tiktok', icon: Globe, name: 'TikTok' }
    }
    if (lowerUrl.includes('linkedin.com') || lowerUrl.includes('linked.in')) {
      return { type: 'linkedin', icon: Linkedin, name: 'LinkedIn' }
    }
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return { type: 'twitter', icon: Globe, name: 'Twitter/X' }
    }
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
      return { type: 'facebook', icon: Globe, name: 'Facebook' }
    }
    return { type: 'website', icon: Globe, name: 'Site web' }
  }

  // Convertir le tableau de liens sociaux en objet pour la base de données
  const convertSocialLinksToObject = (links: string[]): Record<string, string> => {
    const socialObj: Record<string, string> = {}
    links.forEach(link => {
      const detected = detectSocialType(link)
      if (detected.type === 'instagram') {
        socialObj.instagram = link
      } else if (detected.type === 'tiktok') {
        socialObj.tiktok = link
      } else if (detected.type === 'linkedin') {
        socialObj.linkedin = link
      } else if (detected.type === 'twitter') {
        socialObj.twitter = link
      } else if (detected.type === 'facebook') {
        socialObj.facebook = link
      } else {
        socialObj.website = link
      }
    })
    return socialObj
  }

  const handleSave = () => {
    if (!user) return

    // Vérifier le consentement avant de sauvegarder
    profileConsent.requireConsent(async () => {
      await performSave()
    })
  }

  const performSave = async () => {
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
          social_links: convertSocialLinksToObject(profile.socialLinks),
          phone_verified: profile.phone_verified,
          statuses: profile.statuses.length > 0 ? profile.statuses : null,
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
              <GooglePlacesAutocomplete
                value={profile.location}
                onChange={(value) => setProfile(prev => ({ ...prev, location: value }))}
                onLocationSelect={(location) => {
                  setProfile(prev => ({
                    ...prev,
                    location: location.city || location.address.split(',')[0].trim() || location.address
                  }))
                }}
                placeholder="Rechercher une adresse (ex: Paris, France)"
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
              <div className="services-list">
                  {profile.services.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="service-header">
                      <div className="service-info">
                        <h4 className="service-name">{service.name}</h4>
                        {service.description && (
                          <p className="service-description">{service.description}</p>
                        )}
                        <div className="service-payment-info">
                          <span className="service-payment-type">
                            {service.payment_type === 'price' ? (
                              <>
                                <DollarSign size={14} />
                                Prix: {service.value}
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} />
                                Échange: {service.value}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="service-actions">
                      <button
                        type="button"
                          className="service-edit-button"
                          onClick={() => handleOpenServiceModal(index)}
                      >
                          <Edit2 size={16} />
                      </button>
                  <button
                    type="button"
                          className="service-remove-button"
                          onClick={() => handleRemoveService(index)}
                  >
                          <X size={16} />
                  </button>
                </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="service-add-button"
                  onClick={() => handleOpenServiceModal()}
                >
                  <Plus size={18} />
                  Ajouter un service
                </button>
              </div>
            </div>

            {/* Modal pour ajouter/modifier un service */}
            {showServiceModal && (
              <div className="service-modal-overlay" onClick={handleCloseServiceModal}>
                <div className="service-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="service-modal-header">
                    <h3>{editingServiceIndex !== null ? 'Modifier le service' : 'Ajouter un service'}</h3>
                    <button
                      type="button"
                      className="service-modal-close"
                      onClick={handleCloseServiceModal}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="service-modal-body">
            <div className="form-group">
                      <label htmlFor="service-name">Nom du service *</label>
                  <input
                    type="text"
                        id="service-name"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Photographie de mariage"
                  />
                </div>
                    <div className="form-group">
                      <label htmlFor="service-description">Description courte (1 à 2 lignes maximum)</label>
                      <textarea
                        id="service-description"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez brièvement votre service..."
                        rows={2}
                        maxLength={200}
                      />
                      <div className="char-count">{serviceForm.description.length}/200</div>
                </div>
                    <div className="form-group">
                      <label htmlFor="service-payment-type">Mode de paiement *</label>
                      <select
                        id="service-payment-type"
                        value={serviceForm.payment_type}
                        onChange={(e) => setServiceForm(prev => ({ 
                      ...prev,
                          payment_type: e.target.value as 'price' | 'exchange',
                          value: '' // Réinitialiser la valeur lors du changement
                    }))}
                      >
                        <option value="price">Prix</option>
                        <option value="exchange">Échange de service</option>
                      </select>
                </div>
                    <div className="form-group">
                      <label htmlFor="service-value">
                        {serviceForm.payment_type === 'price' ? 'Prix *' : 'Valeur associée (description de l\'échange) *'}
                      </label>
                      {serviceForm.payment_type === 'price' ? (
                  <input
                    type="text"
                          id="service-value"
                          value={serviceForm.value}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Ex: 150€, Sur devis, Gratuit..."
                        />
                      ) : (
                        <textarea
                          id="service-value"
                          value={serviceForm.value}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Décrivez ce que vous proposez en échange..."
                          rows={3}
                          maxLength={300}
                  />
                      )}
                </div>
                  </div>
                  <div className="service-modal-footer">
                    <button
                      type="button"
                      className="service-modal-cancel"
                      onClick={handleCloseServiceModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="service-modal-save"
                      onClick={handleSaveService}
                    >
                      {editingServiceIndex !== null ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liens sociaux */}
            <div className="form-group">
              <label>Réseaux sociaux</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {profile.socialLinks.map((link, index) => {
                    const detected = detectSocialType(link)
                    const Icon = detected.icon
                    return (
                      <span key={index} className="tag social-tag">
                        <Icon size={14} />
                        <span className="tag-text">{link}</span>
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveSocialLink(link)}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )
                  })}
                </div>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    value={newSocialLink}
                    onChange={(e) => setNewSocialLink(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSocialLink()
                      }
                    }}
                    placeholder="Ajouter un lien (ex: @username, https://instagram.com/...)"
                  />
                  <button
                    type="button"
                    className="tag-add-button"
                    onClick={handleAddSocialLink}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Statuts */}
            <div className="form-group">
              <label className="section-label">
                <Briefcase size={18} />
                Statuts professionnels
              </label>
              <p className="form-hint">Ajoutez vos statuts professionnels, rôles ou compétences principales (comme un CV)</p>
              
              {/* Liste des statuts ajoutés */}
              <div className="statuses-list">
                {profile.statuses.map((status, index) => (
                  <div key={index} className="status-item">
                    <div className="status-header">
                      <div className="status-name-wrapper">
                        <Briefcase size={16} />
                        <span className="status-name">{status.name}</span>
                        <button
                          type="button"
                          className="status-remove"
                          onClick={() => handleRemoveStatus(status.name)}
                        >
                          <X size={14} />
                        </button>
                    </div>
                  <button
                    type="button"
                        className="status-description-toggle"
                        onClick={() => {
                          if (selectedStatusForDescription === status.name) {
                            setSelectedStatusForDescription(null)
                            setStatusDescription('')
                          } else {
                            setSelectedStatusForDescription(status.name)
                            setStatusDescription(status.description)
                          }
                        }}
                  >
                        <Edit2 size={14} />
                        {status.description ? 'Modifier description' : 'Ajouter description'}
                  </button>
              </div>
                    {selectedStatusForDescription === status.name && (
                      <div className="status-description-editor">
                        <textarea
                          value={statusDescription}
                          onChange={(e) => setStatusDescription(e.target.value)}
                          onBlur={() => {
                            handleUpdateStatusDescription(status.name, statusDescription)
                            setSelectedStatusForDescription(null)
                          }}
                          placeholder="Décrivez ce que vous faites, vos diplômes, vos prestations..."
                          rows={3}
                          maxLength={500}
                        />
                        <div className="char-count">{statusDescription.length}/500</div>
                    </div>
                    )}
                    {status.description && selectedStatusForDescription !== status.name && (
                      <div className="status-description-display">
                        <p>{status.description}</p>
                  </div>
                    )}
                    </div>
                ))}
                    </div>

              {/* Recherche et ajout de statut */}
              <div className="status-search-container">
                <div className="status-search-wrapper">
                  <Search size={18} className="status-search-icon" />
                  <input
                    type="text"
                    className="status-search-input"
                    value={statusSearch}
                    onChange={(e) => {
                      setStatusSearch(e.target.value)
                      setShowStatusSuggestions(true)
                    }}
                    onFocus={() => setShowStatusSuggestions(true)}
                    placeholder="Rechercher un statut (ex: Créateur de contenu, Photographe...)"
                  />
                </div>
                
                {/* Suggestions de statuts */}
                {showStatusSuggestions && statusSearch && (
                  <div className="status-suggestions">
                    {filteredStatusRecommendations.length > 0 ? (
                      filteredStatusRecommendations.map((status, index) => (
                      <button
                          key={index}
                        type="button"
                          className="status-suggestion-item"
                          onClick={() => handleAddStatus(status)}
                      >
                          {status}
                      </button>
                      ))
                    ) : (
                      <div className="status-suggestion-item no-results">
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}

                {/* Liste complète des recommandations si pas de recherche */}
                {showStatusSuggestions && !statusSearch && (
                  <div className="status-suggestions">
                    <div className="status-suggestions-header">Recommandations</div>
                    {statusRecommendations.map((status, index) => (
                        <button
                        key={index}
                          type="button"
                        className="status-suggestion-item"
                        onClick={() => handleAddStatus(status)}
                        >
                        {status}
                        </button>
                    ))}
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

      {/* Modal de consentement pour les données personnelles */}
      <ConsentModal
        visible={profileConsent.showModal}
        title={profileConsent.messages.title}
        message={profileConsent.messages.message}
        onAccept={profileConsent.handleAccept}
        onReject={handleRejectConsent}
      />
    </div>
  )
}

export default EditPublicProfile
