import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Save, X, Camera, Plus } from 'lucide-react'
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
import { CustomList } from '../../components/CustomList/CustomList'
import { publicationTypes } from '../../constants/publishData'
import { getAllPaymentOptions, getPaymentOptionConfig } from '../../utils/publishHelpers'
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
    display_categories: [] as string[],
    profile_types: [] as string[],
    services: [] as Array<{
      name: string
      description: string
      payment_type: string
      value: string
    }>,
    socialLinks: [] as string[],
    phone: '',
    email: '',
    phone_verified: false,
    email_verified: false
  })
  const [displayCategorySearch, setDisplayCategorySearch] = useState('')
  const [showDisplayCategorySuggestions, setShowDisplayCategorySuggestions] = useState(false)
  const displayCategorySearchRef = useRef<HTMLDivElement>(null)
  const [profileTypeSearch, setProfileTypeSearch] = useState('')
  const [showProfileTypeSuggestions, setShowProfileTypeSuggestions] = useState(false)
  const profileTypeSearchRef = useRef<HTMLDivElement>(null)
  const [showCustomProfileTypeInput, setShowCustomProfileTypeInput] = useState(false)
  const [customProfileType, setCustomProfileType] = useState('')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    payment_type: '',
    value: ''
  })
  const [showServiceNameSuggestions, setShowServiceNameSuggestions] = useState(false)
  const [isServicePaymentOpen, setIsServicePaymentOpen] = useState(false)

  // Hook de consentement pour les données personnelles du profil
  const profileConsent = useConsent('profile_data')
  const confirmation = useConfirmation()
  const { showSuccess, showError } = useToastContext()
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
    
    const parseProfileTypes = (value: unknown) => {
      if (!value) return []
      if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean)
      if (typeof value !== 'string') return []
      const trimmed = value.trim()
      if (!trimmed) return []
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v)).filter(Boolean)
        }
      } catch {
        // Ignore JSON parse errors and fall back to delimiter split
      }
      return trimmed
        .split('||')
        .map(item => item.trim())
        .filter(Boolean)
    }

    const initialProfileTypes = parseProfileTypes((profileData as { profile_type?: string | null }).profile_type)
      .filter(type => type !== 'other')

    setProfile({
      avatar_url: (profileData as { avatar_url?: string | null }).avatar_url || '',
      username: authUsername || (profileData as { username?: string | null }).username || '',
      full_name: authFullName || (profileData as { full_name?: string | null }).full_name || '',
      location: (profileData as { location?: string | null }).location || '',
      bio: (profileData as { bio?: string | null }).bio || '',
      skills: (profileData as { skills?: string[] | null }).skills || [],
      display_categories: (profileData as { display_categories?: string[] | null }).display_categories || [],
      profile_types: initialProfileTypes,
      services: (() => {
        const servicesData = (profileData as { services?: Array<{ name: string; description: string; payment_type: string; value: string }> | string[] | null }).services
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
              payment_type: 'remuneration',
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
          const rawPaymentType = String(serviceObj.payment_type || '').trim()
          const normalizedPaymentType = rawPaymentType === 'exchange'
            ? 'echange'
            : rawPaymentType === 'price'
              ? 'remuneration'
              : rawPaymentType || 'remuneration'
          const normalizedService = {
            name: String(serviceObj.name || '').trim(),
            description: String(serviceObj.description || '').trim(),
            payment_type: normalizedPaymentType,
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
      const target = event.target as Node
      if (displayCategorySearchRef.current && !displayCategorySearchRef.current.contains(target)) {
        setShowDisplayCategorySuggestions(false)
      }
      if (profileTypeSearchRef.current && !profileTypeSearchRef.current.contains(target)) {
        setShowProfileTypeSuggestions(false)
      }
    }

    if (showDisplayCategorySuggestions || showProfileTypeSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDisplayCategorySuggestions, showProfileTypeSuggestions])

  useEffect(() => {
    if (isServicePaymentOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    document.body.style.overflow = ''
    return undefined
  }, [isServicePaymentOpen])

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


  const profileTypeOptions = useMemo(() => ([
    { id: 'creator', label: 'Créateur(trice) de contenu' },
    { id: 'freelance', label: 'Prestataire / Freelance' },
    { id: 'company', label: 'Entreprise' },
    { id: 'studio', label: 'Studio / Lieu' },
    { id: 'institut', label: 'Institut / Beauté' },
    { id: 'community-manager', label: 'Community manager' },
    { id: 'monteur', label: 'Monteur(euse)' },
    { id: 'animateur', label: 'Animateur(rice)' },
    { id: 'redacteur', label: 'Rédacteur(rice)' },
    { id: 'scenariste', label: 'Scénariste' },
    { id: 'coach', label: 'Coach' },
    { id: 'agence', label: 'Agence' },
    { id: 'branding', label: 'Branding' },
    { id: 'analyse-profil', label: 'Analyse de profil' },
    { id: 'other', label: 'Autre' }
  ]), [])

  const serviceNameOptions = useMemo(() => {
    const servicesCategory = publicationTypes.find(category => category.slug === 'services')
    if (!servicesCategory) return []
    return servicesCategory.subcategories
      .filter(sub => sub.id !== 'tout' && sub.id !== 'autre')
      .map(sub => sub.name)
  }, [])

  const filteredServiceNameOptions = useMemo(() => {
    const search = serviceForm.name.trim().toLowerCase()
    if (!search) return serviceNameOptions
    return serviceNameOptions.filter(option => option.toLowerCase().includes(search))
  }, [serviceForm.name, serviceNameOptions])

  const displayCategoryOptions = useMemo(() => (
    publicationTypes.map(category => ({
      id: category.slug,
      label: t(`categories:titles.${category.slug}`, { defaultValue: category.name })
    }))
  ), [t])

  const displayCategoryLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    displayCategoryOptions.forEach(option => map.set(option.id, option.label))
    return map
  }, [displayCategoryOptions])

  const filteredDisplayCategoryOptions = useCallback(() => {
    if (!displayCategorySearch.trim()) {
      return displayCategoryOptions
    }
    const searchLower = displayCategorySearch.toLowerCase()
    return displayCategoryOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [displayCategorySearch, displayCategoryOptions])

  const filteredProfileTypeOptions = useCallback(() => {
    if (!profileTypeSearch.trim()) {
      return profileTypeOptions
    }
    const searchLower = profileTypeSearch.toLowerCase()
    return profileTypeOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [profileTypeSearch, profileTypeOptions])

  const handleAddDisplayCategory = (categorySlug: string) => {
    if (!profile.display_categories.includes(categorySlug)) {
      setProfile(prev => ({
        ...prev,
        display_categories: [...prev.display_categories, categorySlug]
      }))
    }
    setDisplayCategorySearch('')
    setShowDisplayCategorySuggestions(false)
  }

  const handleRemoveDisplayCategory = (categorySlug: string) => {
    setProfile(prev => ({
      ...prev,
      display_categories: prev.display_categories.filter(cat => cat !== categorySlug)
    }))
  }

  const MAX_PROFILE_TYPES = 2

  const formatProfileTypeLabel = (typeId: string) => {
    return profileTypeOptions.find(option => option.id === typeId)?.label || typeId
  }

  const handleAddProfileType = (typeId: string) => {
    if (!typeId) return
    if (typeId === 'other') {
      setShowCustomProfileTypeInput(true)
      setCustomProfileType('')
      setProfileTypeSearch('')
      setShowProfileTypeSuggestions(false)
      return
    }
    if (profile.profile_types.length >= MAX_PROFILE_TYPES) {
      showError('Vous pouvez choisir 2 statuts maximum')
      return
    }
    if (profile.profile_types.includes(typeId)) {
      setProfileTypeSearch('')
      setShowProfileTypeSuggestions(false)
      return
    }
    setProfile(prev => ({ ...prev, profile_types: [...prev.profile_types, typeId] }))
    setProfileTypeSearch('')
    setShowProfileTypeSuggestions(false)
  }

  const handleRemoveProfileType = (typeId: string) => {
    setProfile(prev => ({
      ...prev,
      profile_types: prev.profile_types.filter(type => type !== typeId)
    }))
  }

  const handleConfirmCustomProfileType = () => {
    const trimmed = customProfileType.trim()
    if (!trimmed) {
      showError('Précisez votre statut')
      return
    }
    if (profile.profile_types.length >= MAX_PROFILE_TYPES) {
      showError('Vous pouvez choisir 2 statuts maximum')
      return
    }
    if (!profile.profile_types.includes(trimmed)) {
      setProfile(prev => ({ ...prev, profile_types: [...prev.profile_types, trimmed] }))
    }
    setCustomProfileType('')
    setShowCustomProfileTypeInput(false)
  }

  const normalizeServicePaymentType = (value: string) => {
    if (value === 'price') return 'remuneration'
    if (value === 'exchange') return 'echange'
    return value
  }

  const handleOpenServiceModal = (index?: number) => {
    if (index !== undefined && index !== null) {
      // Modifier un service existant
      setEditingServiceIndex(index)
      const existingService = profile.services[index]
      setServiceForm({
        ...existingService,
        payment_type: normalizeServicePaymentType(existingService.payment_type)
      })
      } else {
      // Ajouter un nouveau service
      setEditingServiceIndex(null)
      setServiceForm({
        name: '',
        description: '',
        payment_type: '',
        value: ''
      })
    }
    setShowServiceNameSuggestions(false)
    setIsServicePaymentOpen(false)
    setShowServiceModal(true)
  }

  const handleCloseServiceModal = () => {
    setShowServiceModal(false)
    setEditingServiceIndex(null)
    setServiceForm({
      name: '',
      description: '',
      payment_type: '',
      value: ''
    })
    setShowServiceNameSuggestions(false)
    setIsServicePaymentOpen(false)
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

    const paymentConfig = getPaymentOptionConfig(serviceForm.payment_type)
    const requiresPrice = !!paymentConfig?.requiresPrice
    const requiresExchangeService = !!paymentConfig?.requiresExchangeService
    const requiresPercentage = !!paymentConfig?.requiresPercentage

    if ((requiresPrice || requiresExchangeService || requiresPercentage) && !serviceForm.value.trim()) {
      if (requiresPrice) {
        alert('Le prix est obligatoire')
      } else if (requiresPercentage) {
        alert('Le pourcentage est obligatoire')
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

    let updatedServices: Array<{ name: string; description: string; payment_type: string; value: string }>
    
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

  // Convertir le tableau de liens sociaux en objet pour la base de données
  const convertSocialLinksToObject = (links: string[]): Record<string, string> => {
    const firstLink = links[0]?.trim()
    return firstLink ? { website: firstLink } : {}
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
      const profileTypesToSave = profile.profile_types.length > 0
        ? JSON.stringify(profile.profile_types)
        : null
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
          display_categories: profile.display_categories,
          profile_type: profileTypesToSave,
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
        <div className="edit-public-profile-spacer" />
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
              <label htmlFor="full_name">Nom</label>
              <input
                type="text"
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Pseudo</label>
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
              <label htmlFor="location">Ville</label>
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
              <label htmlFor="bio">Bio</label>
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

            {/* Catégories d'affichage */}
            <div className="form-group compact-top">
              <label>Catégories d'affichage</label>
              <p className="form-hint compact">Choisissez où vous voulez que votre profil apparaisse dans l'application.</p>

              <div className="tags-list">
                {profile.display_categories.map((categorySlug) => (
                  <span key={categorySlug} className="tag">
                    {displayCategoryLabelMap.get(categorySlug) || categorySlug}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveDisplayCategory(categorySlug)}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="interest-search-container" ref={displayCategorySearchRef}>
                <div className="interest-search-wrapper">
                  <input
                    type="text"
                    className="interest-search-input"
                    value={displayCategorySearch}
                    onChange={(e) => {
                      setDisplayCategorySearch(e.target.value)
                      setShowDisplayCategorySuggestions(true)
                    }}
                    onFocus={() => setShowDisplayCategorySuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const exactMatch = filteredDisplayCategoryOptions().find(
                          opt => opt.label.toLowerCase() === displayCategorySearch.toLowerCase()
                        )
                        if (exactMatch) {
                          handleAddDisplayCategory(exactMatch.id)
                        }
                      }
                    }}
                    placeholder="Choisir une catégorie"
                  />
                </div>

                {showDisplayCategorySuggestions && (
                  <div className="interest-suggestions">
                    {filteredDisplayCategoryOptions().length > 0 ? (
                      <>
                        {filteredDisplayCategoryOptions().map((option) => {
                          const isAlreadyAdded = profile.display_categories.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`interest-suggestion-item ${isAlreadyAdded ? 'disabled' : ''}`}
                              onClick={() => !isAlreadyAdded && handleAddDisplayCategory(option.id)}
                              disabled={isAlreadyAdded}
                            >
                              {option.label}
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
                  </div>
                )}
              </div>
            </div>

            {/* Statuts */}
            <div className="form-group">
              <label>Statuts</label>
              <p className="form-hint compact">Choisissez jusqu’à 2 statuts pour aider les autres à mieux vous identifier.</p>

              <div className="tags-list">
                {profile.profile_types.map((typeId) => (
                  <span key={typeId} className="tag">
                    {formatProfileTypeLabel(typeId)}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveProfileType(typeId)}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="interest-search-container" ref={profileTypeSearchRef}>
                <div className="interest-search-wrapper">
                  <input
                    type="text"
                    className="interest-search-input"
                    value={profileTypeSearch}
                    onChange={(e) => {
                      setProfileTypeSearch(e.target.value)
                      setShowProfileTypeSuggestions(true)
                    }}
                    onFocus={() => setShowProfileTypeSuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const exactMatch = filteredProfileTypeOptions().find(
                          opt => opt.label.toLowerCase() === profileTypeSearch.toLowerCase()
                        )
                        if (exactMatch) {
                          handleAddProfileType(exactMatch.id)
                        }
                      }
                    }}
                    placeholder="Choisir un statut (max 2)"
                  />
                </div>

                {showProfileTypeSuggestions && (
                  <div className="interest-suggestions">
                    {filteredProfileTypeOptions().length > 0 ? (
                      <>
                        {filteredProfileTypeOptions().map((option) => {
                          const isAlreadyAdded = profile.profile_types.includes(option.id)
                          const isLimitReached = profile.profile_types.length >= MAX_PROFILE_TYPES
                          const isDisabled = isAlreadyAdded || isLimitReached
                          return (
                          <button
                            key={option.id}
                            type="button"
                            className={`interest-suggestion-item ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && handleAddProfileType(option.id)}
                            disabled={isDisabled}
                          >
                            {option.label}
                          </button>
                        )})}
                      </>
                    ) : (
                      <div className="interest-suggestion-item no-results">
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showCustomProfileTypeInput && (
                <div className="custom-status-row">
                  <input
                    type="text"
                    className="custom-status-input"
                    value={customProfileType}
                    onChange={(e) => setCustomProfileType(e.target.value)}
                    placeholder="Précisez votre statut"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleConfirmCustomProfileType()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="custom-status-button"
                    onClick={handleConfirmCustomProfileType}
                  >
                    Ajouter
                  </button>
                </div>
              )}
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
                      <p className="form-hint compact">
                        Choisissez un service existant ou écrivez le vôtre.
                      </p>
                      <div className="service-name-field">
                        <input
                          type="text"
                          id="service-name"
                          value={serviceForm.name}
                          onChange={(e) => {
                            setServiceForm(prev => ({ ...prev, name: e.target.value }))
                            setShowServiceNameSuggestions(true)
                          }}
                          onFocus={() => setShowServiceNameSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowServiceNameSuggestions(false), 120)
                          }}
                          placeholder="Ex: Montage, Coaching contenu..."
                        />
                        {showServiceNameSuggestions && (
                          <div className="service-name-suggestions">
                            {filteredServiceNameOptions.length > 0 ? (
                              filteredServiceNameOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className="service-name-suggestion"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    setServiceForm(prev => ({ ...prev, name: option }))
                                    setShowServiceNameSuggestions(false)
                                  }}
                                >
                                  {option}
                                </button>
                              ))
                            ) : (
                              <div className="service-name-suggestion empty">
                                Aucun service trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                    <div className="form-group dropdown-field">
                      <label className="form-label">Mode de paiement *</label>
                      <button
                        type="button"
                        className={`dropdown-trigger ${isServicePaymentOpen ? 'open' : ''}`}
                        onClick={() => setIsServicePaymentOpen((prev) => !prev)}
                      >
                        <span>
                          {getPaymentOptionConfig(serviceForm.payment_type)?.name ?? 'Choisir un moyen de paiement'}
                        </span>
                        <span className="dropdown-caret" aria-hidden="true" />
                      </button>
                      {isServicePaymentOpen && (
                        <div
                          className="service-payment-backdrop"
                          onClick={() => setIsServicePaymentOpen(false)}
                        />
                      )}
                      {isServicePaymentOpen && (
                        <div className="service-payment-panel service-payment-list">
                          <div className="service-payment-title">Choisissez votre mode de paiement</div>
                          <CustomList
                            items={getAllPaymentOptions()}
                            selectedId={serviceForm.payment_type}
                            onSelectItem={(optionId) => {
                              setServiceForm(prev => ({
                                ...prev,
                                payment_type: optionId,
                                value: ''
                              }))
                              setIsServicePaymentOpen(false)
                            }}
                            className="payment-options-list service-payment-options"
                            showCheckbox={false}
                            showDescription={false}
                          />
                        </div>
                      )}
                    </div>
                    {(() => {
                      const paymentConfig = getPaymentOptionConfig(serviceForm.payment_type)
                      const requiresPrice = !!paymentConfig?.requiresPrice
                      const requiresExchangeService = !!paymentConfig?.requiresExchangeService
                      const requiresPercentage = !!paymentConfig?.requiresPercentage
                      const shouldShowValue = requiresPrice || requiresExchangeService || requiresPercentage
                      const valueLabel = requiresPrice
                        ? 'Prix *'
                        : requiresPercentage
                          ? 'Pourcentage *'
                          : 'Valeur associée (description de l\'échange) *'
                      const valuePlaceholder = requiresPrice
                        ? 'Ex: 150€, Sur devis, Gratuit...'
                        : requiresPercentage
                          ? 'Ex: 10%'
                          : 'Décrivez ce que vous proposez en échange...'

                      if (!shouldShowValue) return null

                      return (
                        <div className="form-group">
                          <label htmlFor="service-value">{valueLabel}</label>
                          {requiresPrice || requiresPercentage ? (
                            <input
                              type="text"
                              id="service-value"
                              value={serviceForm.value}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder={valuePlaceholder}
                            />
                          ) : (
                            <textarea
                              id="service-value"
                              value={serviceForm.value}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder={valuePlaceholder}
                              rows={3}
                              maxLength={300}
                            />
                          )}
                        </div>
                      )
                    })()}
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

            {/* Lien */}
            <div className="form-group">
              <label>Lien</label>
              <input
                type="text"
                value={profile.socialLinks[0] || ''}
                onChange={(e) => {
                  const value = e.target.value.trim()
                  setProfile(prev => ({
                    ...prev,
                    socialLinks: value ? [value] : []
                  }))
                }}
                placeholder="https://..."
              />
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
        onLearnMore={profileConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={profileConsent.askAgainNextTime}
        onAskAgainChange={profileConsent.setAskAgainNextTime}
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
