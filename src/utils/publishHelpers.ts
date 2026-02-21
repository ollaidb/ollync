import { supabase } from '../lib/supabaseClient'
import { evaluateTextModeration } from './textModeration'

interface FormData {
  listingType?: 'offer' | 'request' | ''
  category: string | null
  subcategory: string | null
  option: string | null
  platform: string | null
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  contract_type?: string
  work_schedule?: string
  responsibilities?: string
  required_skills?: string
  benefits?: string
  materialCondition?: string
  location: string
  location_city: string
  location_lat: number | null
  location_lng: number | null
  location_address: string
  location_visible_to_participants_only: boolean
  event_mode?: 'in_person' | 'remote' | ''
  event_platform?: string
  exchange_type: string
  exchange_service?: string
  revenue_share_percentage?: string
  co_creation_details?: string
  urgent: boolean
  images: string[]
  video: string | null
  dateFrom: string
  dateTo: string
  deadline: string
  neededTime?: string
  maxParticipants: string
  profileLevel?: string
  profileRoles?: string[]
  duration_minutes: string
  visibility: string
  externalLink?: string
  documentUrl?: string
  documentName?: string
  taggedPostId?: string
  businessOpeningHours?: Array<{
    day: string
    enabled: boolean
    start: string
    end: string
  }>
  billingHours?: string
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface PaymentOptionConfig {
  id: string
  name: string
  description?: string
  requiresPrice?: boolean
  requiresPercentage?: boolean
  requiresExchangeService?: boolean
}

const PAYMENT_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  emploi: ['remuneration'],
  services: ['remuneration', 'echange'],
  'poste-service': ['remuneration', 'visibilite-contre-service'],
  'studio-lieu': ['remuneration', 'visibilite-contre-service'],
  vente: ['remuneration'],
  'casting-role': ['remuneration', 'participation'],
  evenements: ['remuneration', 'participation']
}

const DEFAULT_PAYMENT_OPTIONS = [
  'remuneration',
  'partage-revenus',
  'echange',
  'visibilite-contre-service',
  'co-creation',
  'participation',
  'association'
]

const PAYMENT_OPTION_CONFIGS: Record<string, PaymentOptionConfig> = {
  'co-creation': {
    id: 'co-creation',
    name: 'Co-création',
    description: 'Collaboration créative où les  parties contribuent conjointement au projet avec partage des résultats.',
  },
  participation: {
    id: 'participation',
    name: 'Participation',
    description: 'Rejoindre en tant que participant(e).'
  },
  association: {
    id: 'association',
    name: 'Association',
    description:
      'Regroupement de ressources et compétences pour atteindre un objectif commun en tant que partenaires.'
  },
  'partage-revenus': {
    id: 'partage-revenus',
    name: 'Partage de revenus',
    description: 'Les gains générés sont répartis entre les partenaires selon un pourcentage convenu d\'avance.',
    requiresPercentage: true
  },
  remuneration: {
    id: 'remuneration',
    name: 'Rémunération',
    description: 'Paiement en euros pour les services rendus ou le travail fourni selon un tarif établi.',
    requiresPrice: true
  },
  prix: {
    id: 'prix',
    name: 'Prix',
    description: 'Prix fixe à payer pour l’annonce.',
    requiresPrice: true
  },
  echange: {
    id: 'echange',
    name: 'Échange de service',
    description: 'Troc de services où les parties s\'échangent leurs compétences sans transaction monétaire.',
    requiresExchangeService: true
  },
  'visibilite-contre-service': {
    id: 'visibilite-contre-service',
    name: 'Visibilité contre service',
    description: 'Accord où une mise en visibilité est offerte en échange d\'un service rendu.'
  }
}

export const getPaymentOptionsForCategory = (
  categorySlug?: string | null
): PaymentOptionConfig[] => {
  const optionIds = PAYMENT_OPTIONS_BY_CATEGORY[categorySlug ?? ''] || DEFAULT_PAYMENT_OPTIONS
  return optionIds.map((id) => PAYMENT_OPTION_CONFIGS[id] || { id, name: id })
}

export const getAllPaymentOptions = (): PaymentOptionConfig[] => {
  const optionOrder = [
    'remuneration',
    'partage-revenus',
    'echange',
    'visibilite-contre-service',
    'co-creation',
    'participation',
    'association',
    'prix'
  ]

  return optionOrder.map((id) => PAYMENT_OPTION_CONFIGS[id] || { id, name: id })
}

export const getPaymentOptionConfig = (
  paymentType?: string | null
): PaymentOptionConfig | null => {
  if (!paymentType) return null
  return PAYMENT_OPTION_CONFIGS[paymentType] || { id: paymentType, name: paymentType }
}

/**
 * Valide tous les champs obligatoires pour la publication d'une annonce
 * @param formData - Les données du formulaire
 * @param requireSocialNetwork - Si true, le réseau social est obligatoire
 * @returns Un objet avec isValid (boolean) et errors (string[])
 */
export const validatePublishForm = (
  formData: FormData,
  requireSocialNetwork: boolean = false
): ValidationResult => {
  const CASTING_SLUGS = new Set(['casting-role', 'casting'])
  const errors: string[] = []
  const EMPLOI_SLUGS = new Set(['emploi', 'montage', 'recrutement'])
  const isJobCategory = EMPLOI_SLUGS.has(formData.category || '')
  const isJobRequest = isJobCategory && formData.listingType === 'request'
  const isCastingFigurantRequest =
    formData.listingType === 'request' &&
    CASTING_SLUGS.has(formData.category || '') &&
    (formData.subcategory || '').trim().toLowerCase() === 'figurant'
  const isStudioLieuCategory = formData.category === 'studio-lieu'
  const isVenteCategory = formData.category === 'vente'
  const isPosteServiceCategory = formData.category === 'poste-service'
  const isProjetsEquipeCategory = formData.category === 'projets-equipe'
  const isServicesCategory = formData.category === 'services'
  const isEvenementsCategory = formData.category === 'evenements'
  const isSuiviCategory = formData.category === 'suivi'
  const isProjetsEquipeRequest =
    formData.listingType === 'request' &&
    (formData.category === 'projets-equipe' || formData.category === 'projet')
  const parseTimeToMinutes = (value?: string) => {
    if (!value) return NaN
    const trimmed = value.trim()
    if (!trimmed) return NaN
    const [hRaw, mRaw] = trimmed.split(':')
    const h = parseInt(hRaw || '0', 10)
    const m = parseInt(mRaw || '0', 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    if (h < 0 || h > 23 || m < 0 || m > 59) return NaN
    return h * 60 + m
  }

  if (!formData.listingType || (formData.listingType || '').trim().length === 0) {
    errors.push('Vous devez choisir si vous proposez ou si vous cherchez')
  }

  // Catégorie et sous-catégorie
  if (!formData.category) {
    errors.push('La catégorie est obligatoire')
  }
  if (!formData.subcategory) {
    errors.push('La sous-catégorie est obligatoire')
  }

  if (formData.category === 'vente' && formData.subcategory === 'gorille') {
    if (!formData.materialCondition || formData.materialCondition.trim().length === 0) {
      errors.push('L\'état du matériel est obligatoire')
    }
  }

  // Titre
  if (!formData.title || formData.title.trim().length === 0) {
    errors.push('Le titre est obligatoire')
  }

  // Description
  if (!formData.description || formData.description.trim().length === 0) {
    errors.push('La description est obligatoire')
  }

  if (isJobCategory && (!formData.contract_type || formData.contract_type.trim().length === 0)) {
    errors.push('Le type de contrat est obligatoire pour un emploi')
  }

  const eventMode = (formData.event_mode || '').trim()
  const isEventRemote = isEvenementsCategory && eventMode === 'remote'
  const isEventInPerson = isEvenementsCategory && eventMode === 'in_person'

  // Lieu / mode évènement
  if (isEvenementsCategory) {
    if (!eventMode) {
      errors.push('Le type de présence est obligatoire pour un événement')
    } else if (!isEventRemote && !isEventInPerson) {
      errors.push('Le type de présence de l’événement est invalide')
    }

    if (isEventInPerson && (!formData.location || formData.location.trim().length === 0)) {
      errors.push('L’adresse est obligatoire pour un événement en présentiel')
    }

    if (isEventRemote && (!formData.event_platform || formData.event_platform.trim().length === 0)) {
      errors.push('La plateforme est obligatoire pour un événement à distance')
    }
  } else if (!formData.location || formData.location.trim().length === 0) {
    errors.push('Le lieu est obligatoire')
  }

  // Date/heure de besoin (non requis pour lieu et vente)
  if (!isStudioLieuCategory && !isVenteCategory && !isCastingFigurantRequest && !isProjetsEquipeRequest) {
    if (!formData.deadline || formData.deadline.trim().length === 0) {
      errors.push('La date de besoin est obligatoire')
    }
    if (
      !isJobCategory &&
      !isProjetsEquipeCategory &&
      !isCastingFigurantRequest &&
      (!formData.neededTime || formData.neededTime.trim().length === 0)
    ) {
      errors.push("L'heure de besoin est obligatoire")
    }
  }

  // Média (au moins une photo ou une vidéo)
  const hasImages = formData.images && formData.images.length > 0
  const hasVideo =
    !!formData.video &&
    !isVenteCategory &&
    !isJobCategory &&
    !isPosteServiceCategory &&
    !isProjetsEquipeCategory &&
    !isServicesCategory &&
    !isEvenementsCategory &&
    !isSuiviCategory
  if (!hasImages && !hasVideo) {
    errors.push('Au moins un média (photo ou vidéo) est obligatoire')
  }

  // Moyen de paiement (non requis pour une demande d'emploi)
  let paymentConfig: PaymentOptionConfig | null = null
  if (!isJobRequest) {
    if (!formData.exchange_type || formData.exchange_type.trim().length === 0) {
      errors.push('Le moyen de paiement est obligatoire')
    }
    
    const allowedPaymentOptions = getPaymentOptionsForCategory(formData.category).map((option) => option.id)
    if (formData.exchange_type && !allowedPaymentOptions.includes(formData.exchange_type)) {
      errors.push('Le moyen de paiement sélectionné n\'est pas disponible pour cette catégorie')
    }

    paymentConfig = getPaymentOptionConfig(formData.exchange_type)
    if (paymentConfig?.requiresPrice) {
      if (!formData.price || formData.price.trim().length === 0 || parseFloat(formData.price) <= 0) {
        errors.push('Le prix est obligatoire pour ce moyen de paiement')
      }
    }
    
    if (paymentConfig?.requiresExchangeService) {
      if (!formData.exchange_service || formData.exchange_service.trim().length === 0) {
        errors.push('La description du service échangé est obligatoire lorsque vous choisissez "Échange de service"')
      }
    }
  }

  if (isStudioLieuCategory) {
    const billingMinutes = parseTimeToMinutes(formData.billingHours)
    if (!formData.billingHours || Number.isNaN(billingMinutes) || billingMinutes <= 0) {
      errors.push('Le nombre d’heures est obligatoire pour une annonce de lieu')
    }

    const openingHours = Array.isArray(formData.businessOpeningHours) ? formData.businessOpeningHours : []
    const enabledDays = openingHours.filter((slot) => slot.enabled)
    if (enabledDays.length === 0) {
      errors.push('Sélectionnez au moins un jour d’ouverture')
    } else {
      const hasInvalidSlot = enabledDays.some(
        (slot) => !slot.start || !slot.end || slot.start >= slot.end
      )
      if (hasInvalidSlot) {
        errors.push('Chaque jour ouvert doit avoir des horaires valides')
      }
    }
  }

  if (paymentConfig?.requiresPercentage) {
    const percentage = formData.revenue_share_percentage ? parseFloat(formData.revenue_share_percentage) : NaN
    if (!formData.revenue_share_percentage || Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
      errors.push('Le pourcentage est obligatoire et doit être compris entre 0 et 100')
    }
  }

  // Réseau social (seulement si requis)
  if (requireSocialNetwork && (!formData.socialNetwork || formData.socialNetwork.trim().length === 0)) {
    errors.push('Le réseau social est obligatoire')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Fonction pour déterminer si le champ "Réseau social" doit être affiché
export const shouldShowSocialNetwork = (
  categorySlug: string | null | undefined,
  subcategorySlug: string | null | undefined
): boolean => {
  if (!categorySlug || !subcategorySlug) return false

  // Catégories où le réseau social est pertinent
  const relevantCategories: Record<string, string[]> = {
    'creation-contenu': ['photo', 'video', 'vlog', 'sketchs', 'trends'],
    'emploi': ['montage', 'live'],
    'services': ['coaching-contenu', 'strategie-editoriale', 'visage-marque', 'animation-compte'],
    'vente': ['comptes']
  }

  const relevantSubcategories = relevantCategories[categorySlug]
  return relevantSubcategories ? relevantSubcategories.includes(subcategorySlug) : false
}

export const getMyLocation = async (
  _formData: FormData,
  setFormData: (updates: Partial<FormData>) => void
) => {
  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas supportée par votre navigateur')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      
      try {
        // Optionnel: utiliser une API de géocodage inverse pour obtenir l'adresse
        await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
        )
        
        // Pour l'instant, on stocke juste les coordonnées
        setFormData({
          location_lat: latitude,
          location_lng: longitude,
          location: `${latitude}, ${longitude}`
        })
      } catch (error) {
        console.error('Error getting location:', error)
        setFormData({
          location_lat: latitude,
          location_lng: longitude,
          location: `${latitude}, ${longitude}`
        })
      }
    },
    (error) => {
      console.error('Error getting location:', error)
      alert('Impossible d\'obtenir votre localisation')
    }
  )
}

export const handlePublish = async (
  formData: FormData,
  navigate: (path: string) => void,
  status: 'draft' | 'active',
  showToast?: (message: string) => void,
  existingPostId?: string | null
) => {
  const CASTING_SLUGS = new Set(['casting-role', 'casting'])
  const EMPLOI_SLUGS = new Set(['emploi', 'montage', 'recrutement'])
  const parseTimeToMinutes = (value?: string) => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const [hRaw, mRaw] = trimmed.split(':')
    const h = parseInt(hRaw || '0', 10)
    const m = parseInt(mRaw || '0', 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    if (h < 0 || h > 23 || m < 0 || m > 59) return null
    return h * 60 + m
  }
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    const confirm = window.confirm('Vous devez être connecté pour publier. Voulez-vous vous connecter ?')
    if (confirm) {
      navigate('/auth/login')
    }
    return
  }

  // Vérifier que le profil existe
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      alert('Votre profil n\'existe pas. Veuillez contacter le support.')
      return
    }
  } catch (error) {
    console.error('Error checking profile:', error)
    alert('Erreur lors de la vérification de votre profil.')
    return
  }

  // Récupérer les IDs et slugs de catégorie/sous-catégorie depuis la base de données
  let categoryId: string | null = null
  let subCategoryId: string | null = null
  let categorySlug: string | null = null
  let subcategorySlug: string | null = null

  try {
    // Récupérer la catégorie (N1)
    if (!formData.category) {
      throw new Error('Category is required')
    }

    const categorySlugAliases: Record<string, string[]> = {
      emploi: ['emploi', 'montage', 'recrutement']
    }

    const categoryCandidates = categorySlugAliases[formData.category] || [formData.category]

    const { data: categoryBySlug } = await supabase
      .from('categories')
      .select('id, slug')
      .in('slug', categoryCandidates)
      .limit(10)

    const pickCategoryByPriority = (rows: Array<{ id: string; slug: string }>) => {
      for (const candidate of categoryCandidates) {
        const found = rows.find((row) => row.slug === candidate)
        if (found) return found
      }
      return rows[0] || null
    }

    const categoryFromSlug = categoryBySlug ? pickCategoryByPriority(categoryBySlug as any[]) : null

    const { data: categoryById } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('id', formData.category)
      .limit(1)

    const categoryRecord = categoryFromSlug || (categoryById && categoryById[0]) || null

    if (categoryRecord) {
      categoryId = (categoryRecord as any).id
      categorySlug = (categoryRecord as any).slug

      // Récupérer la sous-catégorie (N2) si elle existe
      if (formData.subcategory && formData.subcategory !== 'tout') {
        const { data: subCategoryBySlug } = await (supabase.from('sub_categories') as any)
          .select('id, slug')
          .eq('category_id', categoryId)
          .eq('slug', formData.subcategory)
          .limit(1)

        const { data: subCategoryById } = await (supabase.from('sub_categories') as any)
          .select('id, slug')
          .eq('id', formData.subcategory)
          .limit(1)

        const subCategoryRecord =
          (subCategoryBySlug && subCategoryBySlug[0]) || (subCategoryById && subCategoryById[0]) || null

        if (subCategoryRecord) {
          subCategoryId = (subCategoryRecord as any).id
          subcategorySlug = (subCategoryRecord as any).slug
        }
      }
    }
  } catch (error) {
    console.error('Error fetching category/subcategory:', error)
  }

  const normalizedCategorySlug = categorySlug ?? formData.category
  const normalizedSubcategorySlug = subcategorySlug ?? formData.subcategory
  const isJobRequest = EMPLOI_SLUGS.has(normalizedCategorySlug || '') && formData.listingType === 'request'
  const isCastingFigurantRequest =
    formData.listingType === 'request' &&
    CASTING_SLUGS.has((normalizedCategorySlug || '').toLowerCase()) &&
    (normalizedSubcategorySlug || '').toLowerCase() === 'figurant'
  const isProjetsEquipeRequest =
    formData.listingType === 'request' &&
    ((normalizedCategorySlug || '').toLowerCase() === 'projets-equipe' ||
      (normalizedCategorySlug || '').toLowerCase() === 'projet')

  // Déterminer si le réseau social est requis
  const requireSocialNetwork = shouldShowSocialNetwork(formData.category, formData.subcategory)

  // Validation complète des champs obligatoires uniquement pour une publication
  if (status === 'active') {
    const validation = validatePublishForm(
      { ...formData, category: formData.category, subcategory: formData.subcategory },
      requireSocialNetwork
    )
    if (!validation.isValid) {
      alert(validation.errors.join('\n'))
      return
    }
  }

  // Note: Les niveaux N3 et N4 sont stockés dans media_type et option
  // car la base de données n'a que 2 niveaux (category_id et sub_category_id)
  // On peut stocker les slugs N3 et N4 dans des champs JSON ou texte si nécessaire

  if (!categoryId) {
    alert('Erreur: Catégorie introuvable')
    return
  }

  // Préparer les données du post
  let descriptionValue = formData.description.trim()
  
  // Si c'est un échange de service, ajouter la description du service à la description
  if (formData.exchange_type === 'echange' && formData.exchange_service) {
    descriptionValue += `\n\nService échangé : ${formData.exchange_service.trim()}`
  }

  if (formData.exchange_type === 'partage-revenus' && formData.revenue_share_percentage) {
    descriptionValue += `\n\nPartage de revenus : ${formData.revenue_share_percentage.trim()}%`
  }

  if (formData.exchange_type === 'co-creation' && formData.co_creation_details) {
    descriptionValue += `\n\nCo-création : ${formData.co_creation_details.trim()}`
  }

  if (normalizedCategorySlug === 'vente' && normalizedSubcategorySlug === 'gorille' && formData.materialCondition) {
    const hasMaterialCondition = /État du matériel\s*:/i.test(descriptionValue)
    if (!hasMaterialCondition) {
      descriptionValue += `\n\nÉtat du matériel : ${formData.materialCondition.trim()}`
    }
  }

  if (normalizedCategorySlug === 'casting-role' && Array.isArray(formData.modelTypes) && formData.modelTypes.length > 0) {
    const label = `Type de modèle recherché : ${formData.modelTypes.join(', ')}`
    const hasModelTypes = /Type de modèle recherché\s*:/i.test(descriptionValue)
    if (!hasModelTypes) {
      descriptionValue += `\n\n${label}`
    }
  }

  const normalizeExternalLink = (link?: string) => {
    const trimmedLink = link?.trim()
    if (!trimmedLink) return null
    if (/^https?:\/\//i.test(trimmedLink)) {
      return trimmedLink
    }
    return `https://${trimmedLink}`
  }

  const buildDocumentUrlWithName = (url?: string, name?: string) => {
    if (!url) return null
    const baseUrl = url.split('#')[0]
    const trimmedName = name?.trim()
    if (!trimmedName) return baseUrl
    const params = new URLSearchParams({ name: trimmedName })
    return `${baseUrl}#${params.toString()}`
  }
  
  const moderationText = `${formData.title || ''}\n${descriptionValue || ''}`
  const moderationResult = status === 'active'
    ? evaluateTextModeration(moderationText)
    : { score: 0, reasons: [], shouldBlock: false }
  const finalStatus = moderationResult.shouldBlock ? 'pending' : status
  const isEvenementCategory = (normalizedCategorySlug || '').toLowerCase() === 'evenements'
  const eventMode = ((formData.event_mode || '').trim() as 'in_person' | 'remote' | '')
  const isEventRemote = isEvenementCategory && eventMode === 'remote'

  const postData: any = {
    user_id: user.id,
    listing_type: formData.listingType || null,
    category_id: categoryId,
    sub_category_id: subCategoryId,
    title: formData.title.trim(),
    description: descriptionValue,
    // Si la base de données a aussi une colonne content, utiliser la même valeur
    content: descriptionValue,
    price: formData.price ? parseFloat(formData.price) : null,
    contract_type: formData.contract_type?.trim() || null,
    work_schedule: formData.work_schedule?.trim() || null,
    responsibilities: formData.responsibilities?.trim() || null,
    required_skills: formData.required_skills?.trim() || null,
    benefits: formData.benefits?.trim() || null,
    location: isEventRemote ? null : (formData.location || null),
    location_address: isEventRemote ? null : (formData.location_address || null),
    location_city: isEventRemote ? null : (formData.location_city || null),
    location_lat: isEventRemote ? null : (formData.location_lat ?? null),
    location_lng: isEventRemote ? null : (formData.location_lng ?? null),
    event_mode: isEvenementCategory ? (eventMode || null) : null,
    event_platform: isEventRemote ? (formData.event_platform?.trim() || null) : null,
    images: formData.images.length > 0 ? formData.images : null,
    video:
      normalizedCategorySlug === 'emploi' ||
      normalizedCategorySlug === 'poste-service' ||
      normalizedCategorySlug === 'projets-equipe' ||
      normalizedCategorySlug === 'services' ||
      normalizedCategorySlug === 'evenements' ||
      normalizedCategorySlug === 'suivi'
        ? null
        : (formData.video || null),
    is_urgent: formData.urgent || false,
    status: finalStatus,
    payment_type: formData.exchange_type || null,
    // Stocker le réseau social dans media_type si disponible, sinon utiliser N3/N4
    // Priorité : socialNetwork > subSubCategory/option
    // Ne pas inclure si toutes les valeurs sont vides/null
    media_type: (formData.socialNetwork && formData.socialNetwork.trim()) 
      || (formData.subSubCategory && formData.subSubCategory.trim()) 
      || (formData.option && formData.option.trim()) 
      || null,
    needed_date:
      normalizedCategorySlug === 'studio-lieu' || normalizedCategorySlug === 'vente' || isCastingFigurantRequest || isProjetsEquipeRequest
        ? null
        : (formData.deadline || null),
    needed_time:
      normalizedCategorySlug === 'studio-lieu' || normalizedCategorySlug === 'vente' || normalizedCategorySlug === 'emploi' || normalizedCategorySlug === 'projets-equipe' || isCastingFigurantRequest
        ? null
        : (formData.neededTime?.trim() || null),
    number_of_people:
      normalizedCategorySlug === 'vente' || normalizedCategorySlug === 'services' || isJobRequest || isCastingFigurantRequest || isProjetsEquipeRequest
        ? null
        : (formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null),
    duration_minutes:
      normalizedCategorySlug === 'vente' || normalizedCategorySlug === 'emploi' || normalizedCategorySlug === 'projets-equipe' || isCastingFigurantRequest
        ? null
        : (formData.duration_minutes ? parseInt(formData.duration_minutes, 10) : null),
    profile_level:
      normalizedCategorySlug === 'vente' ||
      normalizedCategorySlug === 'creation-contenu' ||
      normalizedCategorySlug === 'poste-service' ||
      normalizedCategorySlug === 'services' ||
      normalizedCategorySlug === 'evenements' ||
      normalizedCategorySlug === 'suivi' ||
      isJobRequest ||
      isProjetsEquipeRequest
        ? null
        : (formData.profileLevel?.trim() || null),
    profile_roles:
      normalizedCategorySlug === 'vente' ||
      normalizedCategorySlug === 'casting-role' ||
      normalizedCategorySlug === 'creation-contenu' ||
      normalizedCategorySlug === 'poste-service' ||
      normalizedCategorySlug === 'services' ||
      normalizedCategorySlug === 'evenements' ||
      normalizedCategorySlug === 'suivi' ||
      isJobRequest ||
      isProjetsEquipeRequest
        ? null
        : (formData.profileRoles && formData.profileRoles.length > 0 ? formData.profileRoles : null),
    external_link:
      normalizedCategorySlug === 'vente' ||
      normalizedCategorySlug === 'creation-contenu' ||
      normalizedCategorySlug === 'poste-service' ||
      normalizedCategorySlug === 'services' ||
      normalizedCategorySlug === 'suivi' ||
      isProjetsEquipeRequest
        ? null
        : normalizeExternalLink(formData.externalLink),
    document_url:
      normalizedCategorySlug === 'vente' ||
      normalizedCategorySlug === 'creation-contenu' ||
      normalizedCategorySlug === 'poste-service' ||
      normalizedCategorySlug === 'services' ||
      normalizedCategorySlug === 'suivi' ||
      isProjetsEquipeRequest
        ? null
        : buildDocumentUrlWithName(formData.documentUrl, formData.documentName),
    tagged_post_id: normalizedCategorySlug === 'vente' ? null : (formData.taggedPostId || null),
    moderation_status: moderationResult.shouldBlock ? 'flagged' : 'clean',
    moderation_reason: moderationResult.reasons.length > 0 ? moderationResult.reasons.join(',') : null,
    moderation_score: moderationResult.score || 0,
    moderated_at: moderationResult.shouldBlock ? new Date().toISOString() : null
  }

  if (normalizedCategorySlug === 'studio-lieu') {
    postData.opening_hours =
      formData.businessOpeningHours && formData.businessOpeningHours.length > 0
        ? formData.businessOpeningHours
        : null
    postData.billing_hours = parseTimeToMinutes(formData.billingHours)
  }

  // Si N4 existe, on peut l'ajouter dans un champ JSON ou texte
  // Exemple: postData.metadata = { subSubSubCategory: formData.subSubSubCategory }

  // Nettoyer les valeurs null/undefined
  Object.keys(postData).forEach(key => {
    if (postData[key] === undefined || postData[key] === '') {
      delete postData[key]
    }
  })

  try {
    const postsTable = supabase.from('posts') as any
    const query = existingPostId
      ? postsTable.update(postData).eq('id', existingPostId).eq('user_id', user.id)
      : postsTable.insert(postData)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (query as any)
      .select()
      .single()

    if (error) {
      console.error('Error publishing post:', error)
      throw error
    }

    if (data) {
      const message = status === 'draft'
        ? 'Enregistré'
        : (finalStatus === 'pending' ? 'Annonce en cours de vérification' : 'Annonce publiée')
      if (showToast) {
        showToast(message)
      } else {
        alert(
          status === 'draft'
            ? 'Brouillon enregistré avec succès !'
            : (finalStatus === 'pending'
              ? 'Votre annonce est en cours de vérification.'
              : 'Annonce publiée avec succès !')
        )
      }
      navigate(`/post/${(data as any).id}`)
    }
  } catch (error: any) {
    console.error('Error publishing post:', error)
    alert(`Erreur lors de la publication: ${error.message || 'Erreur inconnue'}`)
  }
}
