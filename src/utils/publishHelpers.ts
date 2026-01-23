import { supabase } from '../lib/supabaseClient'

interface FormData {
  category: string | null
  subcategory: string | null
  option: string | null
  platform: string | null
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  location: string
  location_city: string
  location_lat: number | null
  location_lng: number | null
  location_address: string
  location_visible_to_participants_only: boolean
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
  maxParticipants: string
  duration_minutes: string
  visibility: string
  externalLink?: string
  documentUrl?: string
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface PaymentOptionConfig {
  id: string
  name: string
  requiresPrice?: boolean
  requiresPercentage?: boolean
  requiresExchangeService?: boolean
}

const PAYMENT_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  montage: ['remuneration'],
  services: ['remuneration', 'echange']
}

const DEFAULT_PAYMENT_OPTIONS = [
  'co-creation',
  'participation',
  'association',
  'partage-revenus',
  'remuneration',
  'echange'
]

const PAYMENT_OPTION_CONFIGS: Record<string, PaymentOptionConfig> = {
  'co-creation': { id: 'co-creation', name: 'Co-création' },
  participation: { id: 'participation', name: 'Participation' },
  association: { id: 'association', name: 'Association' },
  'partage-revenus': { id: 'partage-revenus', name: 'Partage de revenus', requiresPercentage: true },
  remuneration: { id: 'remuneration', name: 'Rémunération', requiresPrice: true },
  prix: { id: 'prix', name: 'Prix', requiresPrice: true },
  echange: { id: 'echange', name: 'Échange de service', requiresExchangeService: true }
}

export const getPaymentOptionsForCategory = (
  categorySlug?: string | null
): PaymentOptionConfig[] => {
  const optionIds = PAYMENT_OPTIONS_BY_CATEGORY[categorySlug ?? ''] || DEFAULT_PAYMENT_OPTIONS
  return optionIds.map((id) => PAYMENT_OPTION_CONFIGS[id] || { id, name: id })
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
  const errors: string[] = []

  // Catégorie et sous-catégorie
  if (!formData.category) {
    errors.push('La catégorie est obligatoire')
  }
  if (!formData.subcategory) {
    errors.push('La sous-catégorie est obligatoire')
  }

  // Titre
  if (!formData.title || formData.title.trim().length === 0) {
    errors.push('Le titre est obligatoire')
  }

  // Description
  if (!formData.description || formData.description.trim().length === 0) {
    errors.push('La description est obligatoire')
  }

  // Lieu
  if (!formData.location || formData.location.trim().length === 0) {
    errors.push('Le lieu est obligatoire')
  }

  // Date de besoin
  if (!formData.deadline || formData.deadline.trim().length === 0) {
    errors.push('La date de besoin est obligatoire')
  }

  // Photo (au moins une image)
  if (!formData.images || formData.images.length === 0) {
    errors.push('Au moins une photo est obligatoire')
  }

  // Moyen de paiement
  if (!formData.exchange_type || formData.exchange_type.trim().length === 0) {
    errors.push('Le moyen de paiement est obligatoire')
  }
  
  const allowedPaymentOptions = getPaymentOptionsForCategory(formData.category).map((option) => option.id)
  if (formData.exchange_type && !allowedPaymentOptions.includes(formData.exchange_type)) {
    errors.push('Le moyen de paiement sélectionné n\'est pas disponible pour cette catégorie')
  }

  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
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
    'creation-contenu': ['photo', 'video', 'vlog', 'sketchs', 'trends', 'evenements'],
    'casting-role': ['figurant', 'modele-photo', 'modele-video', 'invite-podcast'],
    'montage': ['montage', 'live'],
    'services': ['coaching-contenu', 'strategie-editoriale'],
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
  showToast?: (message: string) => void
) => {
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

  // Déterminer si le réseau social est requis
  // formData.category et formData.subcategory sont déjà des slugs
  const requireSocialNetwork = shouldShowSocialNetwork(formData.category, formData.subcategory)

  // Validation complète des champs obligatoires
  const validation = validatePublishForm(formData, requireSocialNetwork)
  if (!validation.isValid) {
    alert(validation.errors.join('\n'))
    return
  }

  // Récupérer les IDs de catégorie et sous-catégorie depuis la base de données
  let categoryId: string | null = null
  let subCategoryId: string | null = null

  try {
    // Récupérer la catégorie (N1)
    if (!formData.category) {
      throw new Error('Category is required')
    }
    
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', formData.category)
      .single()

    if (categoryData) {
      categoryId = (categoryData as any).id

      // Récupérer la sous-catégorie (N2) si elle existe
      if (formData.subcategory && formData.subcategory !== 'tout') {
        const { data: subCategoryData } = await (supabase.from('sub_categories') as any)
          .select('id')
          .eq('category_id', categoryId)
          .eq('slug', formData.subcategory)
          .single()

        if (subCategoryData) {
          subCategoryId = (subCategoryData as any).id
        }
      }
    }
  } catch (error) {
    console.error('Error fetching category/subcategory:', error)
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

  const normalizeExternalLink = (link?: string) => {
    const trimmedLink = link?.trim()
    if (!trimmedLink) return null
    if (/^https?:\/\//i.test(trimmedLink)) {
      return trimmedLink
    }
    return `https://${trimmedLink}`
  }
  
  const postData: any = {
    user_id: user.id,
    category_id: categoryId,
    sub_category_id: subCategoryId,
    title: formData.title.trim(),
    description: descriptionValue,
    // Si la base de données a aussi une colonne content, utiliser la même valeur
    content: descriptionValue,
    price: formData.price ? parseFloat(formData.price) : null,
    location: formData.location || null,
    images: formData.images.length > 0 ? formData.images : null,
    is_urgent: formData.urgent || false,
    status: status,
    payment_type: formData.exchange_type || null,
    // Stocker le réseau social dans media_type si disponible, sinon utiliser N3/N4
    // Priorité : socialNetwork > subSubCategory/option
    // Ne pas inclure si toutes les valeurs sont vides/null
    media_type: (formData.socialNetwork && formData.socialNetwork.trim()) 
      || (formData.subSubCategory && formData.subSubCategory.trim()) 
      || (formData.option && formData.option.trim()) 
      || null,
    needed_date: formData.deadline || null,
    number_of_people: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null,
    external_link: normalizeExternalLink(formData.externalLink),
    document_url: formData.documentUrl?.trim() || null
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
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()

    if (error) {
      console.error('Error publishing post:', error)
      throw error
    }

    if (data) {
      const message = status === 'draft' ? 'Enregistré' : 'Annonce publiée'
      if (showToast) {
        showToast(message)
      } else {
        alert(status === 'draft' ? 'Brouillon enregistré avec succès !' : 'Annonce publiée avec succès !')
      }
      navigate(`/post/${(data as any).id}`)
    }
  } catch (error: any) {
    console.error('Error publishing post:', error)
    alert(`Erreur lors de la publication: ${error.message || 'Erreur inconnue'}`)
  }
}

