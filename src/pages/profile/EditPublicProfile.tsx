import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Save, X, Camera, Instagram, Linkedin, Globe, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConsent } from '../../hooks/useConsent'
import { useConfirmation } from '../../hooks/useConfirmation'
import { useToastContext } from '../../contexts/ToastContext'
import { useNavigationHistory } from '../../hooks/useNavigationHistory'
import PageHeader from '../../components/PageHeader'
import ConsentModal from '../../components/ConsentModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import { LocationAutocomplete } from '../../components/Location/LocationAutocomplete'
import { publicationTypes } from '../../constants/publishData'
import './EditPublicProfile.css'

const EditPublicProfile = () => {
  const { t } = useTranslation(['categories'])
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
      email_verified: false
  })
  const [newSocialLink, setNewSocialLink] = useState('')
  const [interestSearch, setInterestSearch] = useState('')
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false)
  const interestSearchRef = useRef<HTMLDivElement>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    payment_type: 'price' as 'price' | 'exchange',
    value: ''
  })

  // Hook de consentement pour les données personnelles du profil
  const profileConsent = useConsent('profile_data')
  const confirmation = useConfirmation()
  const { showSuccess } = useToastContext()
  const { markNavigatingBack } = useNavigationHistory()

  // Gérer le refus : rediriger vers la page de profil
  const handleRejectConsent = () => {
    profileConsent.handleReject()
    // Retourner vers /profile (niveau parent)
    markNavigatingBack()
    navigate('/profile')
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
      bio: (profileData as { bio?: string | null }).bio || '',
      skills: (profileData as { skills?: string[] | null }).skills || [],
      services: (() => {
        const servicesData = (profileData as { services?: Array<{ name: string; description: string; payment_type: 'price' | 'exchange'; value: string }> | string[] | null }).services
        if (!servicesData) {
          console.log('ℹ️ Aucun service dans le profil (édition)')
          return []
        }
        
        // Si c'est une string JSON, la parser
        let parsedData = servicesData
        if (typeof servicesData === 'string') {
          try {
            parsedData = JSON.parse(servicesData)
          } catch (e) {
            console.error('Erreur parsing services (édition):', e)
            return []
          }
        }
        
        if (!Array.isArray(parsedData)) {
          console.warn('⚠️ Services n\'est pas un tableau (édition):', parsedData)
          return []
        }
        
        console.log(`📦 Services récupérés pour édition: ${parsedData.length}`, parsedData)
        
        // Si les services sont encore des strings (ancien format), les convertir
        if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
          const converted = (parsedData as string[]).map(name => {
            // Si la string est du JSON, le parser
            let serviceName = name
            try {
              const parsed = JSON.parse(name)
              serviceName = typeof parsed === 'string' ? parsed : (parsed?.name || name)
            } catch {
              // Ce n'est pas du JSON, utiliser la string directement
              serviceName = name
            }
            return {
              name: serviceName,
              description: '',
              payment_type: 'price' as const,
              value: ''
            }
          })
          return converted
        }
        
        // Normaliser les services - s'assurer que tous sont bien formatés
        const normalized = (parsedData as Array<unknown>).map((service, index) => {
          // Si le service est une string, la convertir
          if (typeof service === 'string') {
            let serviceName = service
            try {
              const parsed = JSON.parse(service)
              serviceName = typeof parsed === 'string' ? parsed : (parsed?.name || service)
            } catch {
              serviceName = service
            }
            return {
              name: serviceName,
              description: '',
              payment_type: 'price' as const,
              value: ''
            }
          }
          
          // Si c'est un objet, normaliser
          const serviceObj: Record<string, unknown> = typeof service === 'object' && service !== null ? service as Record<string, unknown> : {}
          const normalizedService = {
            name: String(serviceObj.name || '').trim(),
            description: String(serviceObj.description || '').trim(),
            payment_type: (serviceObj.payment_type === 'exchange' ? 'exchange' : 'price') as 'price' | 'exchange',
            value: String(serviceObj.value || '').trim()
          }
          console.log(`  Service ${index}:`, normalizedService)
          return normalizedService
        }).filter(service => service.name && service.name.trim().length > 0) // Filtrer les services sans nom
        
        console.log(`✅ Services normalisés pour édition: ${normalized.length}`)
        return normalized
      })(),
      socialLinks: socialLinksArray,
      phone: (profileData as { phone?: string | null }).phone || '',
      email: user.email || '',
      phone_verified: (profileData as { phone_verified?: boolean | null }).phone_verified || false,
      email_verified: !!user.email_confirmed_at
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

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (interestSearchRef.current && !interestSearchRef.current.contains(event.target as Node)) {
        setShowInterestSuggestions(false)
      }
    }

    if (showInterestSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showInterestSuggestions])

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


  const handleRemoveSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  // Générer la liste des options de centres d'intérêt basée sur les catégories
  const getInterestOptions = useCallback(() => {
    const options: string[] = []
    
    publicationTypes.forEach(category => {
      const categoryLabel = t(`categories:titles.${category.slug}`, { defaultValue: category.name })
      if (category.slug === 'creation-contenu') {
        // Pour "Création de contenu", ajouter la catégorie principale
        options.push(categoryLabel)
        // Ajouter aussi les sous-catégories
        category.subcategories.forEach(sub => {
          if (sub.slug !== 'tout') {
            options.push(t(`categories:submenus.${sub.slug}`, { defaultValue: sub.name }))
          }
        })
      } else {
        // Pour les autres catégories (Casting, Emploi, etc.), ajouter uniquement les sous-catégories
        category.subcategories.forEach(sub => {
          if (sub.slug !== 'tout') {
            options.push(t(`categories:submenus.${sub.slug}`, { defaultValue: sub.name }))
          }
        })
      }
    })
    
    return options.sort()
  }, [t])

  // Filtrer les options selon la recherche
  const filteredInterestOptions = useCallback(() => {
    const allOptions = getInterestOptions()
    if (!interestSearch.trim()) {
      return allOptions
    }
    const searchLower = interestSearch.toLowerCase()
    return allOptions.filter(option => 
      option.toLowerCase().includes(searchLower)
    )
  }, [interestSearch, getInterestOptions])

  // Ajouter un centre d'intérêt
  const handleAddInterest = (interest: string) => {
    const trimmedInterest = interest.trim()
    if (trimmedInterest && !profile.skills.includes(trimmedInterest)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedInterest]
      }))
      setInterestSearch('')
      setShowInterestSuggestions(false)
    }
  }

  // Ajouter un centre d'intérêt personnalisé (pas dans la liste)
  const handleAddCustomInterest = () => {
    if (interestSearch.trim() && !profile.skills.includes(interestSearch.trim())) {
      handleAddInterest(interestSearch)
    }
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

  const handleSaveService = async () => {
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

    if (!user) return

    const updatedService = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      payment_type: serviceForm.payment_type,
      value: serviceForm.value.trim()
    }

    let updatedServices: Array<{ name: string; description: string; payment_type: 'price' | 'exchange'; value: string }>
    
    if (editingServiceIndex !== null) {
      // Modifier un service existant
      updatedServices = profile.services.map((s, i) =>
        i === editingServiceIndex ? updatedService : s
      )
    } else {
      // Ajouter un nouveau service
      updatedServices = [...profile.services, updatedService]
    }

    // Mettre à jour l'état local
    setProfile(prev => ({
      ...prev,
      services: updatedServices
    }))

    // Sauvegarder immédiatement dans la base de données
    try {
      console.log(`💾 Sauvegarde automatique de ${updatedServices.length} services:`, updatedServices)
      // Toujours sauvegarder le tableau, même s'il est vide, pour écraser la valeur existante
      const servicesToSave = updatedServices.length > 0 ? updatedServices : []
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          services: servicesToSave,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('❌ Erreur lors de la sauvegarde automatique:', profileError)
        alert('Erreur lors de la sauvegarde du service')
      } else {
        console.log('✅ Service sauvegardé automatiquement avec succès')
        showSuccess('Service enregistré')
      }
    } catch (err) {
      console.error('Error saving service:', err)
      alert('Erreur lors de la sauvegarde du service')
    }

    handleCloseServiceModal()
  }

  const handleRemoveService = async (index: number) => {
    confirmation.confirm(
      {
        title: 'Supprimer le service',
        message: 'Êtes-vous sûr de vouloir supprimer ce service ?',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        isDestructive: true
      },
      async () => {
        if (!user) return

        const updatedServices = profile.services.filter((_, i) => i !== index)
        
        // Mettre à jour l'état local
        setProfile(prev => ({
          ...prev,
          services: updatedServices
        }))

        // Sauvegarder immédiatement dans la base de données
        try {
          console.log(`💾 Sauvegarde automatique après suppression: ${updatedServices.length} services restants`)
          // Toujours sauvegarder le tableau, même s'il est vide, pour écraser la valeur existante
          const servicesToSave = updatedServices.length > 0 ? updatedServices : []
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: profileError } = await (supabase.from('profiles') as any)
            .upsert({
              id: user.id,
              services: servicesToSave,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.error('❌ Erreur lors de la sauvegarde automatique:', profileError)
            alert('Erreur lors de la suppression du service')
            // Restaurer l'état en cas d'erreur
            setProfile(prev => ({
              ...prev,
              services: profile.services
            }))
          } else {
            console.log('✅ Service supprimé et sauvegardé automatiquement')
            showSuccess('Service supprimé')
          }
        } catch (err) {
          console.error('Error removing service:', err)
          alert('Erreur lors de la suppression du service')
          // Restaurer l'état en cas d'erreur
          setProfile(prev => ({
            ...prev,
            services: profile.services
          }))
        }
      }
    )
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

  const handleRemoveSocialLink = async (link: string) => {
    if (!user) return

    const updatedSocialLinks = profile.socialLinks.filter(l => l !== link)
    
    // Mettre à jour l'état local
    setProfile(prev => ({
      ...prev,
      socialLinks: updatedSocialLinks
    }))

    // Sauvegarder immédiatement dans la base de données
    try {
      console.log(`💾 Sauvegarde automatique après suppression de lien social: ${updatedSocialLinks.length} liens restants`)
      const socialLinksToSave = convertSocialLinksToObject(updatedSocialLinks)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          social_links: Object.keys(socialLinksToSave).length > 0 ? socialLinksToSave : {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('❌ Erreur lors de la sauvegarde automatique:', profileError)
        alert('Erreur lors de la suppression du lien social')
        // Restaurer l'état en cas d'erreur
        setProfile(prev => ({
          ...prev,
          socialLinks: profile.socialLinks
        }))
      } else {
        console.log('✅ Lien social supprimé et sauvegardé automatiquement')
      }
    } catch (err) {
      console.error('Error removing social link:', err)
      alert('Erreur lors de la suppression du lien social')
      // Restaurer l'état en cas d'erreur
      setProfile(prev => ({
        ...prev,
        socialLinks: profile.socialLinks
      }))
    }
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
      console.log(`💾 Sauvegarde de ${profile.services.length} services:`, profile.services)
      
      // Préparer les données pour la sauvegarde
      // Toujours sauvegarder les tableaux (même vides) pour écraser les valeurs existantes
      const servicesToSave = profile.services.length > 0 ? profile.services : []
      const skillsToSave = profile.skills.length > 0 ? profile.skills : []
      console.log(`💾 Services à sauvegarder (${profile.services.length}):`, servicesToSave)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError, data: savedData } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          email: profile.email,
          phone: profile.phone || null,
          bio: profile.bio || null,
          location: profile.location || null,
          avatar_url: profile.avatar_url || null,
          skills: skillsToSave,
          services: servicesToSave,
          social_links: convertSocialLinksToObject(profile.socialLinks),
          phone_verified: profile.phone_verified,
          updated_at: new Date().toISOString()
        })
        .select()

      if (profileError) {
        console.error('❌ Erreur lors de la sauvegarde:', profileError)
        alert('Erreur lors de la mise à jour du profil')
      } else {
        console.log('✅ Profil sauvegardé avec succès:', savedData)
        if (savedData && savedData[0]) {
          console.log(`✅ Services sauvegardés: ${savedData[0].services?.length || 0}`, savedData[0].services)
        }
        showSuccess('Validé')
        // Petit délai pour laisser le toast s'afficher avant la navigation
        setTimeout(() => {
          navigate('/profile/public')
        }, 500)
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
              <label htmlFor="location">Localisation</label>
              <LocationAutocomplete
                value={profile.location}
                onChange={(value) => setProfile(prev => ({ ...prev, location: value }))}
                onLocationSelect={(location) => {
                  setProfile(prev => ({
                    ...prev,
                    location: location.city || location.address.split(',')[0].trim() || location.address
                  }))
                }}
                placeholder="Trouver votre ville"
              />
            </div>

            {/* Bio & Description */}
            <div className="form-group">
              <label htmlFor="bio">Bio & Description</label>
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

            {/* Centres d'intérêt */}
            <div className="form-group">
              <label>Centres d'intérêt</label>
              
              {/* Liste des centres d'intérêt ajoutés */}
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

              {/* Barre de recherche avec suggestions */}
              <div className="interest-search-container" ref={interestSearchRef}>
                <div className="interest-search-wrapper">
                  <input
                    type="text"
                    className="interest-search-input"
                    value={interestSearch}
                    onChange={(e) => {
                      setInterestSearch(e.target.value)
                      setShowInterestSuggestions(true)
                    }}
                    onFocus={() => setShowInterestSuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        // Si la recherche correspond exactement à une option, l'ajouter
                        // Sinon, proposer d'ajouter comme option personnalisée
                        const exactMatch = filteredInterestOptions().find(
                          opt => opt.toLowerCase() === interestSearch.toLowerCase()
                        )
                        if (exactMatch) {
                          handleAddInterest(exactMatch)
                        } else if (interestSearch.trim()) {
                          handleAddCustomInterest()
                        }
                      }
                    }}
                    placeholder="Chercher votre intérêt"
                  />
                </div>
                
                {/* Suggestions de centres d'intérêt */}
                {showInterestSuggestions && (
                  <div className="interest-suggestions">
                    {/* Afficher toutes les options si pas de recherche, sinon filtrer */}
                    {filteredInterestOptions().length > 0 ? (
                      <>
                        {filteredInterestOptions().map((option, index) => {
                          const isAlreadyAdded = profile.skills.includes(option)
                          return (
                            <button
                              key={index}
                              type="button"
                              className={`interest-suggestion-item ${isAlreadyAdded ? 'disabled' : ''}`}
                              onClick={() => !isAlreadyAdded && handleAddInterest(option)}
                              disabled={isAlreadyAdded}
                            >
                              {option}
                              {isAlreadyAdded && <span className="already-added-badge">Ajouté</span>}
                            </button>
                          )
                        })}
                      </>
                    ) : (
                      <div className="interest-suggestion-item no-results">
                        Aucun résultat trouvé
                      </div>
                    )}
                    
                    {/* Option pour ajouter une valeur personnalisée si la recherche ne correspond à rien */}
                    {interestSearch.trim() && 
                     !filteredInterestOptions().some(opt => opt.toLowerCase() === interestSearch.toLowerCase()) &&
                     !profile.skills.includes(interestSearch.trim()) && (
                      <button
                        type="button"
                        className="interest-suggestion-item custom-option"
                        onClick={handleAddCustomInterest}
                      >
                        <Plus size={16} />
                        Ajouter "{interestSearch.trim()}" comme option personnalisée
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="form-group">
              <label>Services</label>
              <p className="form-hint">Cliquez sur un service pour le modifier</p>
              
              {/* Liste des services ajoutés */}
              <div className="tags-list">
                {profile.services.map((service, originalIndex) => {
                  // Extraire uniquement le nom du service
                  let serviceName = ''
                  
                  if (!service) return null
                  
                  if (typeof service === 'string') {
                    // Si c'est une string, vérifier si c'est du JSON
                    const serviceStr: string = service
                    try {
                      const parsed = JSON.parse(serviceStr)
                      if (typeof parsed === 'string') {
                        serviceName = parsed
                      } else if (parsed && typeof parsed === 'object' && parsed.name) {
                        serviceName = String(parsed.name).trim()
                      } else {
                        serviceName = serviceStr
                      }
                    } catch {
                      // Ce n'est pas du JSON, utiliser la string directement
                      serviceName = serviceStr.trim()
                    }
                  } else if (service && typeof service === 'object') {
                    // Si c'est un objet, extraire uniquement le nom
                    serviceName = String(service.name || '').trim()
                  }
                  
                  // Ne pas afficher si le nom est vide ou si ça ressemble à du JSON brut
                  if (!serviceName || serviceName.trim().length === 0 || serviceName.startsWith('{')) {
                    return null
                  }
                  
                  return (
                    <span 
                      key={originalIndex} 
                      className="tag service-tag"
                      onClick={() => handleOpenServiceModal(originalIndex)}
                    >
                      {serviceName}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveService(originalIndex)
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )
                })}
              </div>

              {/* Bouton pour ajouter un service */}
              <button
                type="button"
                className="service-add-button"
                onClick={() => handleOpenServiceModal()}
              >
                <Plus size={18} />
                Ajouter un service
              </button>
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
                    placeholder="Ajouter un lien"
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

            {/* Actions */}
            <div className="form-actions">
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

      {/* Modal de confirmation */}
      {confirmation.options && (
        <ConfirmationModal
          visible={confirmation.isOpen}
          title={confirmation.options.title}
          message={confirmation.options.message}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
          confirmLabel={confirmation.options.confirmLabel}
          cancelLabel={confirmation.options.cancelLabel}
          isDestructive={confirmation.options.isDestructive}
        />
      )}
    </div>
  )
}

export default EditPublicProfile
