import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { shouldShowSocialNetwork, getPaymentOptionsForCategory, getPaymentOptionConfig } from '../../utils/publishHelpers'
import { SOCIAL_NETWORKS_CONFIG } from '../../utils/socialNetworks'
import { CustomList } from '../CustomList/CustomList'
import './Step4Description.css'

interface FormData {
  listingType?: 'offer' | 'request' | ''
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
  deadline?: string
  neededTime?: string
  duration_minutes?: string
  businessOpeningHours?: Array<{
    day: string
    enabled: boolean
    start: string
    end: string
  }>
  billingHours?: string
  materialCondition?: string
  contract_type?: string
  work_schedule?: string
  responsibilities?: string
  required_skills?: string
  benefits?: string
  exchange_service?: string
  revenue_share_percentage?: string
  co_creation_details?: string
  category?: string | null
  subcategory?: string | null
  subSubCategory?: string | null
  [key: string]: any
}

interface Step4DescriptionProps {
  formData: FormData
  onUpdateFormData: (updates: Partial<FormData>) => void
  onContinue: () => void
  selectedCategory?: { slug: string } | null
  selectedSubcategory?: { slug: string } | null
  selectedSubSubCategory?: { slug: string } | null
}

export const Step4Description = ({ 
  formData, 
  onUpdateFormData, 
  onContinue,
  selectedCategory,
  selectedSubcategory
}: Step4DescriptionProps) => {
  const CASTING_SLUGS = new Set(['casting-role', 'casting'])
  const EMPLOI_SLUGS = new Set(['emploi', 'montage', 'recrutement'])
  const isRequestListing = formData.listingType === 'request'
  const categorySlugValue = (selectedCategory?.slug ?? formData.category ?? '').toLowerCase()
  const subcategorySlugValue = (selectedSubcategory?.slug ?? formData.subcategory ?? '').toLowerCase()
  const isCastingCategory = CASTING_SLUGS.has(categorySlugValue)
  const isJobCategory = EMPLOI_SLUGS.has(categorySlugValue)
  const isJobRequest = isJobCategory && isRequestListing
  const isCastingFigurantRequest =
    isRequestListing && isCastingCategory && subcategorySlugValue === 'figurant'
  const showSocialNetwork = !isCastingCategory && !isJobRequest && shouldShowSocialNetwork(
    selectedCategory?.slug,
    selectedSubcategory?.slug
  )
  const isStudioLieuCategory = (selectedCategory?.slug ?? formData.category) === 'studio-lieu'
  const isVenteCategory = (selectedCategory?.slug ?? formData.category) === 'vente'
  const isProjetsEquipeCategory = (selectedCategory?.slug ?? formData.category) === 'projets-equipe'
  const isProjetsEquipeRequest =
    isRequestListing &&
    (selectedCategory?.slug ?? formData.category) &&
    ['projets-equipe', 'projet'].includes(String(selectedCategory?.slug ?? formData.category))
  const paymentOptions = getPaymentOptionsForCategory(selectedCategory?.slug ?? formData.category)
  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
  const requiresPrice = !isJobRequest && !!paymentConfig?.requiresPrice
  const requiresExchangeService = !isJobRequest && !!paymentConfig?.requiresExchangeService
  const requiresRevenueShare = !isJobRequest && !!paymentConfig?.requiresPercentage
  const showCoCreationDetails = !isJobRequest && formData.exchange_type === 'co-creation'
  const showPaymentSection = !isJobRequest && !isVenteCategory && !isJobCategory
  const [isSocialNetworkOpen, setIsSocialNetworkOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [isMaterialConditionOpen, setIsMaterialConditionOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isOpeningDaysOpen, setIsOpeningDaysOpen] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const base = formData.deadline ? new Date(`${formData.deadline}T12:00:00`) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const normalizeTime = (value: string) => {
    const cleaned = value.replace(/[^\d:]/g, '')
    const parts = cleaned.split(':')
    if (parts.length === 1) {
      const raw = parts[0]
      if (raw.length <= 2) return raw
      return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
    }
    const [h, m] = parts
    return `${h.slice(0, 2)}:${m.slice(0, 2)}`
  }

  const formatTime = (value: string) => {
    const [hRaw, mRaw] = value.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const stepTime = (deltaMinutes: number) => {
    const base = formData.neededTime && formData.neededTime.trim().length > 0
      ? formData.neededTime
      : '01:00'
    const [hRaw, mRaw] = base.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    const nextH = Math.floor(normalized / 60)
    const nextM = normalized % 60
    onUpdateFormData({ neededTime: `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}` })
  }

  const contractOptions = [
    { id: 'cdi', name: 'CDI' },
    { id: 'cdd', name: 'CDD' },
    { id: 'freelance', name: 'Freelance' },
    { id: 'stage', name: 'Stage' },
    { id: 'alternance', name: 'Alternance' },
    { id: 'interim', name: 'Intérim' },
    { id: 'autre', name: 'Autre' }
  ]

  const materialConditionOptions = [
    { id: 'neuf', name: 'État neuf' },
    { id: 'bon-etat', name: 'Bon état' },
    { id: 'etat-moyen', name: 'État moyen' }
  ]
  const selectedSocialNetworkName =
    SOCIAL_NETWORKS_CONFIG.find((network) => network.id === formData.socialNetwork)?.name ??
    'Choisir un réseau'
  const selectedPaymentName =
    paymentOptions.find((option) => option.id === formData.exchange_type)?.name ??
    'Choisir un moyen de paiement'
  const selectedContractName =
    contractOptions.find((option) => option.id === formData.contract_type)?.name ??
    'Choisir un type de contrat'
  const selectedMaterialConditionName =
    materialConditionOptions.find((option) => option.id === formData.materialCondition)?.name ??
    'Choisir un état du matériel'
  const formatDurationValue = (value?: string) => {
    const minutes = parseInt(value || '0', 10)
    if (!Number.isFinite(minutes) || minutes <= 0) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h${String(mins).padStart(2, '0')}`
    if (hours > 0) return `${hours}h`
    return `${mins} min`
  }

  const stepDuration = (deltaMinutes: number) => {
    const base = parseInt(formData.duration_minutes || '0', 10) || 0
    const next = Math.max(0, base + deltaMinutes)
    onUpdateFormData({ duration_minutes: next > 0 ? String(next) : '' })
  }

  const stepBillingHours = (deltaMinutes: number) => {
    const base = formData.billingHours && formData.billingHours.trim().length > 0
      ? formData.billingHours
      : '01:00'
    const [hRaw, mRaw] = base.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    const nextH = Math.floor(normalized / 60)
    const nextM = normalized % 60
    onUpdateFormData({ billingHours: `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}` })
  }

  const toDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = new Date()
  const todayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const dayLabels: Record<string, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  }
  const openingDays = formData.businessOpeningHours || []
  const selectedOpeningDays = openingDays.filter((slot) => slot.enabled)

  const formatDeadlineLabel = (value?: string) => {
    if (!value) return 'Choisir une date'
    const parsed = new Date(`${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) return 'Choisir une date'
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const updateOpeningDay = (
    day: string,
    updates: Partial<{ enabled: boolean; start: string; end: string }>
  ) => {
    const next = openingDays.map((slot) =>
      slot.day === day ? { ...slot, ...updates } : slot
    )
    onUpdateFormData({ businessOpeningHours: next })
  }

  const toggleOpeningDay = (day: string) => {
    const target = openingDays.find((slot) => slot.day === day)
    if (!target) return
    updateOpeningDay(day, { enabled: !target.enabled })
  }

  const stepOpeningTime = (
    day: string,
    key: 'start' | 'end',
    deltaMinutes: number
  ) => {
    const target = openingDays.find((slot) => slot.day === day)
    if (!target) return
    const base = target[key] || '09:00'
    const [hRaw, mRaw] = base.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    const nextH = Math.floor(normalized / 60)
    const nextM = normalized % 60
    updateOpeningDay(day, {
      [key]: `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
    })
  }

  useEffect(() => {
    if (!isDatePickerOpen) return
    const base = formData.deadline ? new Date(`${formData.deadline}T12:00:00`) : new Date()
    setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1))
  }, [isDatePickerOpen, formData.deadline])

  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const dayCells: Array<Date | null> = []
  for (let i = 0; i < startOffset; i += 1) dayCells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    dayCells.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))
  }
  while (dayCells.length % 7 !== 0) dayCells.push(null)

  const monthLabel = calendarMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  })
  const isMaterialSale =
    (selectedCategory?.slug ?? formData.category) === 'vente' &&
    (selectedSubcategory?.slug ?? formData.subcategory) === 'gorille'
  const categorySlug = selectedCategory?.slug ?? formData.category ?? ''
  const subcategorySlug = selectedSubcategory?.slug ?? formData.subcategory ?? ''
  const creationContenuExamples: Record<string, { title: string; description: string }> = {
    photo: {
      title: 'Ex : Photo Insta (années 2000)',
      description:
        'Ex : Je cherche à faire des photos Insta style années 2000 pour une durée de 2 heures et environ 20 à 40 photos avec mon téléphone.'
    },
    video: {
      title: 'Ex : Vidéo face-caméra (discussion)',
      description:
        'Ex : Je veux filmer une vidéo face-caméra type discussion pour une durée de 1h30 et 3 vidéos courtes.'
    },
    vlog: {
      title: 'Ex : Vlog (journée)',
      description:
        'Ex : Je veux filmer un vlog de journée pour une durée de 3 heures et un vlog complet (plans + moments clés).'
    },
    sketchs: {
      title: 'Ex : Sketch (titre du sketch)',
      description:
        'Ex : Type comédie/duo/personnages pour une durée de 2 heures et un sketch complet.'
    },
    trends: {
      title: 'Ex : Trend (nom du trend)',
      description:
        'Ex : Trend [nom du trend] pour une durée de 1 heure et 3 vidéos + variantes.'
    },
    live: {
      title: 'Ex : Live (thème du live)',
      description:
        'Ex : Thème [sujet] pour une durée de 45 min et un live clair et interactif.'
    },
    autre: {
      title: 'Ex : Autre type de contenu',
      description:
        'Ex : Décrivez le type de contenu recherché si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const creationContenuRequestExamples: Record<string, { title: string; description: string }> = {
    photo: {
      title: 'Ex : Photographe contenu disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    video: {
      title: 'Ex : Vidéaste contenu disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    vlog: {
      title: 'Ex : Créateur vlog disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    sketchs: {
      title: 'Ex : Créateur sketch disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    trends: {
      title: 'Ex : Créateur trends disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    live: {
      title: 'Ex : Animateur live disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    },
    autre: {
      title: 'Ex : Créateur contenu disponible',
      description:
        'Ex : Indique le type de contenu, ton style, tes disponibilités et le format que tu peux réaliser.'
    }
  }
  const castingRoleExamples: Record<string, { title: string; description: string }> = {
    figurant: {
      title: 'Je cherche 14 figurants pour une vidéo drôle.',
      description:
        'Ex : Je cherche des figurants pour apparaître dans une vidéo comédie. Durée : 2h.'
    },
    'modele-photo': {
      title: 'À la recherche de modèle femme pour shooting sur le thème du moyen âge.',
      description:
        'Ex : Je cherche un modèle photo pour un shooting mode (vêtements/chaussures). Durée : 2h.'
    },
    'modele-video': {
      title: 'À la recherche d’un modèle homme pour apparaître dans un clip.',
      description:
        'Ex : Je cherche un modèle vidéo pour apparaître dans un clip/vidéo créative. Durée : 3h.'
    },
    'voix-off': {
      title: 'À la recherche de voix off grave pour une vidéo de promotion.',
      description:
        'Ex : Je cherche une voix off pour une vidéo promo (1 à 2 minutes).'
    },
    'invite-podcast': {
      title: 'Recherche personne pour discuter autour d’un livre.',
      description:
        'Ex : Je cherche un invité pour parler d’un thème précis dans un podcast. Durée : 45 min.'
    },
    'invite-micro-trottoir': {
      title: 'À la recherche de 3 hommes pour poser des questions sur le thème du voyage.',
      description:
        'Ex : Je cherche des personnes à interviewer dans la rue sur un thème précis. Durée : 10 min.'
    },
    'youtube-video': {
      title: 'Recherche 4 personnes pour participer à un concept YouTube.',
      description:
        'Ex : Je cherche un invité pour une vidéo YouTube (débat/interview/concept). Durée : 1h.'
    },
    autre: {
      title: 'Ex : Autre rôle',
      description:
        'Ex : Décrivez le rôle ou le profil recherché si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const castingRequestExamples: Record<string, { title: string; description: string }> = {
    figurant: {
      title: 'J’ai envie de participer à un tournage en tant que figurant.',
      description:
        'Ex : Indique le type de rôle, ton expérience, tes disponibilités et le format où tu veux intervenir.'
    },
    'modele-photo': {
      title: 'Mannequin amateur je propose mes services en échange de clichés pour mon book.',
      description:
        'Ex : Indique ton profil, ton style et les conditions de collaboration.'
    },
    'modele-video': {
      title: 'Comédienne depuis 5 ans je propose mes services.',
      description:
        'Ex : Précise ton expérience, ton style et le format de vidéos recherché.'
    },
    'voix-off': {
      title: 'Après des études de journalisme, je cherche à m’exercer sur des vidéos.',
      description:
        'Ex : Décris ton type de voix, ton expérience et les formats qui te conviennent.'
    },
    'invite-podcast': {
      title: 'J’ai toujours rêvé d’être dans un podcast !',
      description:
        'Ex : Indique les thèmes sur lesquels tu peux intervenir et ton format préféré.'
    },
    'invite-micro-trottoir': {
      title: 'Avec la copine on propose de participer à un micro-trottoir !',
      description:
        'Ex : Précise le thème, le style d’intervention et ta disponibilité.'
    },
    'youtube-video': {
      title: 'Je suis motivé pour participer à un jeu YouTube.',
      description:
        'Ex : Indique le type de concept YouTube et le rôle que tu peux tenir.'
    }
  }
  const emploiExamples: Record<string, { title: string; description: string }> = {
    montage: {
      title: 'Ex : Monteur vidéo disponible',
      description:
        'Ex : Je propose le montage de vidéos courtes/longues (rythme, habillage, export).'
    },
    'micro-trottoir': {
      title: 'Ex : Réalisation de micro‑trottoir',
      description:
        'Ex : Je propose de réaliser des micro‑trottoirs sur des thèmes précis.'
    },
    'community-manager': {
      title: 'Ex : Community manager disponible',
      description:
        'Ex : Je propose la gestion de vos réseaux (posts, réponses, animation).'
    },
    live: {
      title: 'Ex : Animation de lives',
      description:
        'Ex : Je propose d’animer vos lives et de présenter vos produits/contenus.'
    },
    'ecriture-contenu': {
      title: 'Ex : Rédaction de contenu',
      description:
        'Ex : Je propose la rédaction de scripts, idées et captions.'
    },
    scenariste: {
      title: 'Ex : Scénariste disponible',
      description:
        'Ex : Je propose l’écriture de scripts et scénarios vidéo.'
    },
    autre: {
      title: 'Ex : Service emploi (autre)',
      description:
        'Ex : Décrivez le service que vous proposez si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const emploiRequestExamples: Record<string, { title: string; description: string }> = {
    montage: {
      title: 'Ex : Je suis monteur vidéo',
      description:
        'Ex : Je réalise le montage de vidéos courtes/longues avec un style dynamique.'
    },
    'micro-trottoir': {
      title: 'Ex : Je réalise des micro‑trottoirs',
      description:
        'Ex : Je peux réaliser des micro‑trottoirs sur des thèmes précis.'
    },
    'community-manager': {
      title: 'Ex : Je suis community manager',
      description:
        'Ex : Je gère les réseaux sociaux, la planification éditoriale et l’animation de communauté.'
    },
    live: {
      title: 'Ex : Je suis animateur live',
      description:
        'Ex : J’anime des lives et je présente du contenu/produits en direct.'
    },
    'ecriture-contenu': {
      title: 'Ex : Je suis rédacteur de contenu',
      description:
        'Ex : Je rédige scripts, idées de contenu et descriptions adaptées aux réseaux.'
    },
    scenariste: {
      title: 'Ex : Je suis scénariste',
      description:
        'Ex : Je construis des scripts et des scénarios vidéo.'
    },
    autre: {
      title: 'Ex : Je propose mon profil',
      description:
        'Ex : Décrivez votre profil, vos compétences et ce que vous proposez.'
    }
  }
  const servicesExamples: Record<string, { title: string; description: string }> = {
    'coaching-contenu': {
      title: 'Ex : Je propose un coaching contenu',
      description:
        'Ex : Je propose un coaching pour formats, idées, rythme et direction artistique.'
    },
    'strategie-editoriale': {
      title: 'Ex : Je propose une stratégie éditoriale',
      description:
        'Ex : Je propose un plan de contenu avec thèmes, calendrier et fréquence.'
    },
    organisation: {
      title: 'Ex : J’organise votre production',
      description:
        'Ex : Je propose une organisation du contenu (planning, workflow, priorités).'
    },
    agence: {
      title: 'Ex : Je propose une agence créateur',
      description:
        'Ex : Je propose de gérer les collaborations et partenariats d’un créateur.'
    },
    branding: {
      title: 'Ex : Je propose un branding créateur',
      description:
        'Ex : Je propose une identité visuelle et un positionnement clair.'
    },
    'analyse-profil': {
      title: 'Ex : J’analyse votre profil',
      description:
        'Ex : Je propose un audit complet avec points forts et axes d’amélioration.'
    },
    'proposition-idees': {
      title: 'Ex : Je propose des idées',
      description:
        'Ex : Je propose des idées de contenus adaptées à votre niche.'
    },
    'assistant-createur': {
      title: 'Ex : Je suis assistant créateur',
      description:
        'Ex : Je propose d’assister un créateur dans la production et l’organisation.'
    },
    'monetisation-audience': {
      title: 'Ex : Je propose la monétisation',
      description:
        'Ex : Je propose une stratégie pour monétiser votre audience.'
    },
    'aisance-camera': {
      title: 'Ex : Je propose un coaching caméra',
      description:
        'Ex : Je propose un coaching pour être à l’aise face caméra (posture, voix).'
    },
    'setup-materiel': {
      title: 'Ex : Je propose un setup créateur',
      description:
        'Ex : Je propose un setup de création (décor, éclairage, espace).'
    },
    'visage-marque': {
      title: 'Ex : Je deviens visage de marque',
      description:
        'Ex : J’incarne une marque de manière régulière à travers des vidéos, photos et contenus publiés sur les réseaux.'
    },
    'animation-compte': {
      title: 'Ex : Je gère l’animation du compte',
      description:
        'Ex : Je gère et publie du contenu régulièrement sur le compte pour garder une présence active.'
    },
    autre: {
      title: 'Ex : Autre service',
      description:
        'Ex : Décrivez le service proposé si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const venteExamples: Record<string, { title: string; description: string }> = {
    comptes: {
      title: 'Ex : Compte TikTok à vendre',
      description:
        'Ex : Je vends un compte niche sport avec audience et engagement stables.'
    },
    'noms-utilisateur': {
      title: 'Ex : Nom d’utilisateur à vendre',
      description:
        'Ex : Je vends un nom d’utilisateur court et mémorable pour un nouveau projet.'
    },
    'concepts-niches': {
      title: 'Ex : Concept de contenu à vendre',
      description:
        'Ex : Je vends une idée de concept + ligne éditoriale + formats.'
    },
    gorille: {
      title: 'Ex : Matériel vidéo à vendre',
      description:
        'Ex : Je vends une caméra et un micro (état précisé, prix fixe).'
    },
    autre: {
      title: 'Ex : Autre type de vente',
      description:
        'Ex : Si vous ne trouvez pas la sous‑catégorie, décrivez ce que vous vendez.'
    }
  }
  const posteServiceExamples: Record<string, { title: string; description: string }> = {
    prestation: {
      title: 'Ex : Prestation beauté',
      description:
        'Ex : Ongles/maquillage/coiffure, précisez la prestation et la durée.'
    },
    food: {
      title: 'Ex : Restaurant partenaire',
      description:
        'Ex : Restaurant/café/bar, précisez le type et ce qui est proposé.'
    },
    lieux: {
      title: 'Ex : Lieu touristique',
      description:
        'Ex : Hôtel/loisir/boîte, précisez le type de lieu et ce qui est proposé.'
    },
    autre: {
      title: 'Ex : Autre service',
      description:
        'Ex : Si vous ne trouvez pas la sous‑catégorie, décrivez votre service.'
    }
  }
  const posteServiceRequestExamples: Record<string, { title: string; description: string }> = {
    autre: {
      title: 'Ex : Community manager dispo',
      description:
        'Ex : Indique le poste/service, tes compétences clés, tes disponibilités et le type de collaboration souhaité.'
    }
  }
  const studioLieuExamples: Record<string, { title: string; description: string }> = {
    'studio-creation': {
      title: 'Ex : Studio équipé',
      description:
        'Ex : Studio pour photos/vidéos/interviews, durée et équipement disponibles.'
    },
    'lieux-residentiels': {
      title: 'Ex : Appartement pour shooting',
      description:
        'Ex : Appartement lumineux pour créer du contenu, préciser la durée.'
    },
    'lieux-professionnels': {
      title: 'Ex : Salle pro pour tournage',
      description:
        'Ex : Salle pro pour interviews/lives, préciser la durée.'
    },
    autre: {
      title: 'Ex : Autre lieu',
      description:
        'Ex : Décrivez le lieu proposé si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const projetsExamples: Record<string, { title: string; description: string }> = {
    'projet-emission': {
      title: 'Ex : [Nom du projet émission]',
      description:
        'Ex : Je lance une émission (format, sujets, rythme). Je cherche montage/animation.'
    },
    'projet-newsletter': {
      title: 'Ex : [Nom du projet newsletter]',
      description:
        'Ex : Je lance une newsletter (thème, fréquence). Je cherche rédaction/design.'
    },
    'projet-interview': {
      title: 'Ex : [Nom du projet interview]',
      description:
        'Ex : Je prépare une série d’interviews. Je cherche préparation/tournage/montage.'
    },
    'projet-podcast': {
      title: 'Ex : [Nom du projet podcast]',
      description:
        'Ex : Je lance un podcast (thème, format). Je cherche co‑animation/montage audio.'
    },
    'projet-documentaire': {
      title: 'Ex : [Nom du projet documentaire]',
      description:
        'Ex : Je réalise un documentaire (sujet, angle). Je cherche tournage/montage.'
    },
    'projet-court-metrage': {
      title: 'Ex : [Nom du projet court‑métrage]',
      description:
        'Ex : Je crée un court‑métrage (scénario prêt). Je cherche acteurs/montage.'
    },
    'projet-youtube': {
      title: 'Ex : [Nom du projet chaîne YouTube]',
      description:
        'Ex : Je lance une chaîne YouTube (concept). Je cherche tournage/montage.'
    },
    'projet-magazine': {
      title: 'Ex : [Nom du projet magazine]',
      description:
        'Ex : Je crée un magazine (thème). Je cherche rédaction/design/édition.'
    },
    'projet-blog': {
      title: 'Ex : [Nom du projet blog]',
      description:
        'Ex : Je lance un blog (thème). Je cherche rédaction/SEO/visuels.'
    },
    'projet-media': {
      title: 'Ex : [Nom du projet média]',
      description:
        'Ex : Je crée un média (ligne édito). Je cherche production/édition/diffusion.'
    },
    autre: {
      title: 'Ex : [Nom du projet]',
      description:
        'Ex : Je décris le projet et les profils recherchés.'
    }
  }
  const projetsRequestExamples: Record<string, { title: string; description: string }> = {
    'podcast-equipe': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    'chaine-youtube': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    'projet-tiktok': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    'projet-formation': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    'projet-blog': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    'projet-media': {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    },
    autre: {
      title: 'Ex : Profil créatif pour projet en équipe',
      description:
        'Ex : Indique tes compétences principales, ton rôle idéal dans l’équipe et tes disponibilités.'
    }
  }
  const creationExample = isRequestListing
    ? (creationContenuRequestExamples[subcategorySlug] || creationContenuExamples[subcategorySlug])
    : creationContenuExamples[subcategorySlug]
  const castingExample = isRequestListing
    ? (castingRequestExamples[subcategorySlug] || castingRoleExamples[subcategorySlug])
    : castingRoleExamples[subcategorySlug]
  const emploiExample = isJobRequest
    ? (emploiRequestExamples[subcategorySlug] || {
        title: 'Ex : Je cherche un profil pour mon besoin',
        description: 'Ex : Décrivez le poste recherché, le contexte et le résultat attendu.'
      })
    : (emploiExamples[subcategorySlug] || {
        title: 'Ex : Je propose un service en emploi',
        description: 'Ex : Décrivez clairement ce que vous proposez.'
      })
  const servicesExample = servicesExamples[subcategorySlug]
  const servicesRequestExample = {
    title: 'Ex : Monteur vidéo dispo pour mission',
    description: 'Ex : Indique le service proposé, les outils maîtrisés, les délais et le type de mission que tu acceptes.'
  }
  const venteExample = venteExamples[subcategorySlug]
  const posteServiceExample = isRequestListing
    ? (posteServiceRequestExamples[subcategorySlug] || posteServiceRequestExamples.autre)
    : posteServiceExamples[subcategorySlug]
  const studioLieuExample = studioLieuExamples[subcategorySlug]
  const projetsExample = isRequestListing
    ? (projetsRequestExamples[subcategorySlug] || {
        title: 'Ex : Je candidate pour rejoindre une équipe',
        description: 'Ex : Je présente mon profil, mes compétences et ce que je peux apporter au projet.'
      })
    : projetsExamples[subcategorySlug]
  const activeExample =
    categorySlug === 'creation-contenu'
      ? creationExample
      : categorySlug === 'casting-role'
        ? castingExample
        : categorySlug === 'emploi'
          ? emploiExample
          : categorySlug === 'services'
            ? (isRequestListing ? servicesRequestExample : servicesExample)
            : categorySlug === 'vente'
              ? venteExample
              : categorySlug === 'poste-service'
                ? posteServiceExample
                : categorySlug === 'studio-lieu'
                  ? studioLieuExample
                  : (categorySlug === 'projets-equipe' || categorySlug === 'projet')
                    ? projetsExample
                : undefined
  const titlePlaceholder = activeExample?.title ?? 'Ex: Développeur React recherché'
  const descriptionPlaceholder = isJobCategory
    ? (isJobRequest
      ? 'Présente ton profil, tes compétences et le type de poste que tu recherches.'
      : 'Décris le poste, les missions, les compétences requises, le profil recherché et les avantages.')
    : activeExample?.description ?? 'Décrivez en détail votre annonce...'
  
  // Synchroniser le moyen de paiement avec la catégorie sélectionnée
  useEffect(() => {
    if (paymentOptions.length === 0) return
    const hasValidPayment = paymentOptions.some((option) => option.id === formData.exchange_type)
    const shouldFixInvalid = !!formData.exchange_type && !hasValidPayment

    if (shouldFixInvalid) {
      onUpdateFormData({
        exchange_type: '',
        price: '',
        exchange_service: '',
        revenue_share_percentage: '',
        co_creation_details: ''
      })
    }
  }, [paymentOptions])

  useEffect(() => {
    if (isJobRequest) return
    if (isJobCategory && formData.exchange_type !== 'remuneration') {
      onUpdateFormData({
        exchange_type: 'remuneration',
        exchange_service: '',
        revenue_share_percentage: '',
        co_creation_details: ''
      })
    }
  }, [isJobCategory, isJobRequest, formData.exchange_type, onUpdateFormData])

  useEffect(() => {
    if (!isJobRequest) return
    const updates: Partial<FormData> = {}
    if (formData.socialNetwork) updates.socialNetwork = ''
    if (formData.exchange_type) updates.exchange_type = ''
    if (formData.price) updates.price = ''
    if (formData.exchange_service) updates.exchange_service = ''
    if (formData.revenue_share_percentage) updates.revenue_share_percentage = ''
    if (formData.co_creation_details) updates.co_creation_details = ''
    if (formData.responsibilities) updates.responsibilities = ''
    if (formData.required_skills) updates.required_skills = ''
    if (formData.benefits) updates.benefits = ''
    if (Object.keys(updates).length > 0) {
      onUpdateFormData(updates)
    }
  }, [
    isJobRequest,
    formData.socialNetwork,
    formData.exchange_type,
    formData.price,
    formData.exchange_service,
    formData.revenue_share_percentage,
    formData.co_creation_details,
    formData.responsibilities,
    formData.required_skills,
    formData.benefits,
    onUpdateFormData
  ])

  const hasSheetOpen =
    isContractOpen ||
    isSocialNetworkOpen ||
    isPaymentOpen ||
    isMaterialConditionOpen ||
    isDatePickerOpen ||
    isOpeningDaysOpen

  useEffect(() => {
    if (!hasSheetOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [hasSheetOpen])

  useEffect(() => {
    if (!hasSheetOpen || typeof window === 'undefined') {
      setKeyboardInset(0)
      return
    }
    const viewport = window.visualViewport
    if (!viewport) return

    const updateInset = () => {
      const nextInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
      )
      setKeyboardInset(nextInset)
    }

    updateInset()
    viewport.addEventListener('resize', updateInset)
    viewport.addEventListener('scroll', updateInset)

    return () => {
      viewport.removeEventListener('resize', updateInset)
      viewport.removeEventListener('scroll', updateInset)
      setKeyboardInset(0)
    }
  }, [hasSheetOpen])

  useEffect(() => {
    if (!isCastingFigurantRequest) return
    const updates: Partial<FormData> = {}
    if (formData.deadline) updates.deadline = ''
    if (formData.neededTime) updates.neededTime = ''
    if (formData.duration_minutes) updates.duration_minutes = ''
    if (Object.keys(updates).length > 0) {
      onUpdateFormData(updates)
    }
  }, [
    isCastingFigurantRequest,
    formData.deadline,
    formData.neededTime,
    formData.duration_minutes,
    onUpdateFormData
  ])

  useEffect(() => {
    if (!isVenteCategory) return
    const updates: Partial<FormData> = {}
    if (formData.exchange_type !== 'remuneration') updates.exchange_type = 'remuneration'
    if (formData.exchange_service) updates.exchange_service = ''
    if (formData.revenue_share_percentage) updates.revenue_share_percentage = ''
    if (formData.co_creation_details) updates.co_creation_details = ''
    if (Object.keys(updates).length > 0) {
      onUpdateFormData(updates)
    }
  }, [
    isVenteCategory,
    formData.exchange_type,
    formData.exchange_service,
    formData.revenue_share_percentage,
    formData.co_creation_details,
    onUpdateFormData
  ])

  const MIN_TITLE_CHARS = 20
  const MIN_DESCRIPTION_CHARS = 80
  const MIN_WORK_SCHEDULE_CHARS = 5
  const MIN_RESPONSIBILITIES_CHARS = 60
  const MIN_REQUIRED_SKILLS_CHARS = 40
  const MIN_BENEFITS_CHARS = 30

  const titleLength = formData.title.trim().length
  const descriptionLength = formData.description.trim().length
  const workScheduleLength = (formData.work_schedule || '').trim().length
  const responsibilitiesLength = (formData.responsibilities || '').trim().length
  const requiredSkillsLength = (formData.required_skills || '').trim().length
  const benefitsLength = (formData.benefits || '').trim().length
  
  // Validation complète des champs obligatoires de cette étape
  const canContinue = 
    titleLength >= MIN_TITLE_CHARS &&
    descriptionLength >= MIN_DESCRIPTION_CHARS &&
    (!isJobCategory || (formData.contract_type && formData.contract_type.trim().length > 0)) &&
    (!isJobCategory || isJobRequest || workScheduleLength >= MIN_WORK_SCHEDULE_CHARS) &&
    (!isJobCategory || isJobRequest || responsibilitiesLength >= MIN_RESPONSIBILITIES_CHARS) &&
    (!isJobCategory || isJobRequest || requiredSkillsLength >= MIN_REQUIRED_SKILLS_CHARS) &&
    (!isJobCategory || isJobRequest || benefitsLength >= MIN_BENEFITS_CHARS) &&
    (isJobRequest || formData.exchange_type.trim().length > 0) &&
    (!requiresPrice || (formData.price && parseFloat(formData.price) > 0)) &&
    (!requiresExchangeService || (formData.exchange_service && formData.exchange_service.trim().length > 0)) &&
    (!requiresRevenueShare || (
      formData.revenue_share_percentage && 
      !Number.isNaN(parseFloat(formData.revenue_share_percentage)) &&
      parseFloat(formData.revenue_share_percentage) > 0 &&
      parseFloat(formData.revenue_share_percentage) <= 100
    )) &&
    (!isMaterialSale || (formData.materialCondition && formData.materialCondition.trim().length > 0)) &&
    (!showSocialNetwork || (formData.socialNetwork && formData.socialNetwork.trim().length > 0)) &&
    (!isStudioLieuCategory || (
      !!formData.billingHours &&
      /^\d{1,2}:\d{2}$/.test(formData.billingHours) &&
      formData.billingHours !== '00:00' &&
      Array.isArray(formData.businessOpeningHours) &&
      formData.businessOpeningHours.some((slot) => slot.enabled && slot.start && slot.end && slot.start < slot.end)
    ))

  const renderBottomSheet = (
    open: boolean,
    onClose: () => void,
    title: string,
    content: ReactNode,
    panelClassName = ''
  ) => {
    if (!open || typeof document === 'undefined') return null
    const panelStyle: CSSProperties = keyboardInset > 0
      ? { bottom: keyboardInset, maxHeight: `calc(100vh - env(safe-area-inset-top, 0px) - 84px - ${keyboardInset}px)` }
      : {}
    return createPortal(
      <>
        <div className="publish-dropdown-backdrop" onClick={onClose} />
        <div
          className={`publish-dropdown-panel ${panelClassName}`.trim()}
          style={panelStyle}
          onClick={(event) => event.stopPropagation()}
        >
          {title && <div className="publish-dropdown-title">{title}</div>}
          {content}
        </div>
      </>,
      document.body
    )
  }

  return (
    <div className="step4-description">
      <h2 className="step-title">{isJobRequest ? 'Présentez votre candidature' : 'Décrivez votre annonce'}</h2>
      
      <div className="form-group">
        <label className="form-label">{isJobRequest ? 'Titre de votre candidature *' : 'Titre *'}</label>
        <input
          type="text"
          className="form-input"
          placeholder={titlePlaceholder}
          value={formData.title}
          onChange={(e) => onUpdateFormData({ title: e.target.value })}
        />
        <div className="form-field-meta">
          Minimum {MIN_TITLE_CHARS} caractères ({titleLength}/{MIN_TITLE_CHARS})
        </div>
      </div>

      {isJobCategory && (
        <>
          <div className="form-group dropdown-field">
            <label className="form-label">{isJobRequest ? 'Type de contrat souhaité *' : 'Type de contrat *'}</label>
            <button
              type="button"
              className={`dropdown-trigger ${isContractOpen ? 'open' : ''}`}
              onClick={() => setIsContractOpen((prev) => !prev)}
            >
              <span>{selectedContractName}</span>
              <span className="dropdown-caret" aria-hidden="true" />
            </button>
            {renderBottomSheet(
              isContractOpen,
              () => setIsContractOpen(false),
              'Choisissez un type de contrat',
              <CustomList
                items={contractOptions}
                selectedId={formData.contract_type}
                onSelectItem={(optionId) => {
                  onUpdateFormData({ contract_type: optionId })
                  setIsContractOpen(false)
                }}
                className="publish-list"
                showCheckbox={false}
                showDescription={false}
              />
            )}
          </div>
        </>
      )}

      {showSocialNetwork && (
        <div className="form-group dropdown-field">
          <label className="form-label">Réseau social concerné *</label>
          <button
            type="button"
            className={`dropdown-trigger ${isSocialNetworkOpen ? 'open' : ''}`}
            onClick={() => setIsSocialNetworkOpen((prev) => !prev)}
          >
            <span>{selectedSocialNetworkName}</span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {renderBottomSheet(
            isSocialNetworkOpen,
            () => setIsSocialNetworkOpen(false),
            'Choisissez un réseau social',
            <CustomList
              items={SOCIAL_NETWORKS_CONFIG}
              selectedId={formData.socialNetwork}
              onSelectItem={(networkId) => {
                onUpdateFormData({ socialNetwork: networkId })
                setIsSocialNetworkOpen(false)
              }}
              className="social-networks-list publish-list"
              showCheckbox={false}
            />
          )}
        </div>
      )}

      {!isJobCategory && (
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            placeholder={descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={6}
          />
          <div className="form-field-meta">
            Minimum {MIN_DESCRIPTION_CHARS} caractères ({descriptionLength}/{MIN_DESCRIPTION_CHARS})
          </div>
        </div>
      )}

      {isMaterialSale && (
        <div className="form-group dropdown-field">
          <label className="form-label">État du matériel *</label>
          <button
            type="button"
            className={`dropdown-trigger ${isMaterialConditionOpen ? 'open' : ''}`}
            onClick={() => setIsMaterialConditionOpen((prev) => !prev)}
          >
            <span>{selectedMaterialConditionName}</span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {renderBottomSheet(
            isMaterialConditionOpen,
            () => setIsMaterialConditionOpen(false),
            'Choisissez un état du matériel',
            <CustomList
              items={materialConditionOptions}
              selectedId={formData.materialCondition}
              onSelectItem={(optionId) => {
                onUpdateFormData({ materialCondition: optionId })
                setIsMaterialConditionOpen(false)
              }}
              className="publish-list"
              showCheckbox={false}
              showDescription={false}
            />
          )}
        </div>
      )}

      {showPaymentSection && (
        <div className="form-group dropdown-field">
          <label className="form-label">
            {isJobCategory ? 'Type de rémunération *' : 'Moyen de paiement *'}
          </label>
          <button
            type="button"
            className={`dropdown-trigger ${isPaymentOpen ? 'open' : ''}`}
            onClick={() => setIsPaymentOpen((prev) => !prev)}
          >
            <span>{selectedPaymentName}</span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {renderBottomSheet(
            isPaymentOpen,
            () => setIsPaymentOpen(false),
            'Choisissez un moyen de paiement',
            <CustomList
              items={paymentOptions}
              selectedId={formData.exchange_type}
              onSelectItem={(optionId) => {
                onUpdateFormData({
                  exchange_type: optionId,
                  price: optionId === 'remuneration' ? formData.price : '',
                  exchange_service: optionId === 'echange' ? formData.exchange_service : '',
                  revenue_share_percentage: optionId === 'partage-revenus' ? formData.revenue_share_percentage : '',
                  co_creation_details: optionId === 'co-creation' ? formData.co_creation_details : ''
                })
                setIsPaymentOpen(false)
              }}
              className="payment-options-list publish-list"
              showCheckbox={false}
              showDescription={true}
              truncateDescription={false}
            />
          )}
        </div>
      )}

      {/* Champs liés au moyen de paiement: affichés juste après la sélection */}
      {isStudioLieuCategory && (
        <div className="form-group">
          <label className="form-label">
            {formData.exchange_type === 'visibilite-contre-service'
              ? "Temps (heures/minutes) pour service contre visibilité *"
              : "Temps (heures/minutes) *"}
          </label>
          <div className="time-input-row">
            <input
              type="text"
              className="form-input time-input"
              placeholder="HH:MM"
              value={formData.billingHours || '01:00'}
              onChange={(e) => onUpdateFormData({ billingHours: normalizeTime(e.target.value) })}
              onBlur={() => onUpdateFormData({ billingHours: formatTime(formData.billingHours || '01:00') })}
              inputMode="numeric"
            />
            <div className="time-stepper">
              <button
                type="button"
                className="time-stepper-btn"
                onClick={() => stepBillingHours(30)}
                aria-label="Augmenter de 30 minutes"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="time-stepper-btn"
                onClick={() => stepBillingHours(-30)}
                aria-label="Diminuer de 30 minutes"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {requiresPrice && (
        <div className="form-group">
          <label className="form-label">{isJobCategory ? 'Prix par heure *' : 'Prix *'}</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={formData.price}
            onChange={(e) => onUpdateFormData({ price: e.target.value })}
            min="0"
            step="0.01"
          />
        </div>
      )}

      {requiresExchangeService && (
        <div className="form-group">
          <label className="form-label">Décrivez le service échangé *</label>
          <textarea
            className="form-textarea"
            placeholder="Ex: Je propose un échange de service de montage vidéo contre une séance photo..."
            value={formData.exchange_service || ''}
            onChange={(e) => onUpdateFormData({ exchange_service: e.target.value })}
            rows={4}
          />
        </div>
      )}

      {requiresRevenueShare && (
        <div className="form-group">
          <label className="form-label">Pourcentage de partage (%) *</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={formData.revenue_share_percentage || ''}
            onChange={(e) => onUpdateFormData({ revenue_share_percentage: e.target.value })}
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      )}

      {showCoCreationDetails && (
        <div className="form-group">
          <label className="form-label">Détails de co-création (optionnel)</label>
          <textarea
            className="form-textarea"
            placeholder="Ajoutez une précision si besoin..."
            value={formData.co_creation_details || ''}
            onChange={(e) => onUpdateFormData({ co_creation_details: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {isStudioLieuCategory && (
        <div className="form-group">
          <label className="form-label">Jours et horaires d'ouverture *</label>
          <div className="dropdown-field">
            <button
              type="button"
              className={`dropdown-trigger ${isOpeningDaysOpen ? 'open' : ''}`}
              onClick={() => setIsOpeningDaysOpen((prev) => !prev)}
            >
              <span>
                {selectedOpeningDays.length > 0
                  ? `${selectedOpeningDays.length} jour(s) sélectionné(s)`
                  : 'Choisir les jours d’ouverture'}
              </span>
              <span className="dropdown-caret" aria-hidden="true" />
            </button>
            {renderBottomSheet(
              isOpeningDaysOpen,
              () => setIsOpeningDaysOpen(false),
              '',
              <div className="opening-hours-sheet-content">
                <div className="opening-hours-sheet-header">
                  <h3>Jours d’ouverture</h3>
                  <button
                    type="button"
                    className="opening-hours-sheet-close"
                    onClick={() => setIsOpeningDaysOpen(false)}
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="opening-hours-sheet-divider" />
                <div className="opening-days-list">
                  {openingDays.map((slot) => (
                    <div
                      key={slot.day}
                      className={`opening-day-item ${slot.enabled ? 'selected' : ''}`}
                    >
                      <button
                        type="button"
                        className="opening-day-row"
                        onClick={() => toggleOpeningDay(slot.day)}
                      >
                        <span>{dayLabels[slot.day] || slot.day}</span>
                        <span className={`opening-day-check ${slot.enabled ? 'checked' : ''}`} aria-hidden="true">
                          <span className="opening-day-checkmark">✓</span>
                        </span>
                      </button>
                      {slot.enabled && (
                        <div className="opening-day-hours-inline">
                          <label className="opening-hours-time-label">Entre quelle heure et quelle heure ?</label>
                          <div className="opening-day-hours-grid">
                            <div className="opening-hours-time-block">
                              <span className="opening-hours-time-label">De</span>
                              <div className="time-input-row">
                                <input
                                  type="text"
                                  className="form-input opening-hours-time"
                                  value={slot.start}
                                  onChange={(event) =>
                                    updateOpeningDay(slot.day, { start: normalizeTime(event.target.value) })
                                  }
                                  onBlur={() =>
                                    updateOpeningDay(slot.day, { start: formatTime(slot.start || '09:00') })
                                  }
                                  placeholder="HH:MM"
                                  inputMode="numeric"
                                />
                                <div className="time-stepper">
                                  <button
                                    type="button"
                                    className="time-stepper-btn"
                                    onClick={() => stepOpeningTime(slot.day, 'start', 30)}
                                    aria-label="Augmenter de 30 minutes"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="time-stepper-btn"
                                    onClick={() => stepOpeningTime(slot.day, 'start', -30)}
                                    aria-label="Diminuer de 30 minutes"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="opening-hours-time-block">
                              <span className="opening-hours-time-label">À</span>
                              <div className="time-input-row">
                                <input
                                  type="text"
                                  className="form-input opening-hours-time"
                                  value={slot.end}
                                  onChange={(event) =>
                                    updateOpeningDay(slot.day, { end: normalizeTime(event.target.value) })
                                  }
                                  onBlur={() =>
                                    updateOpeningDay(slot.day, { end: formatTime(slot.end || '18:00') })
                                  }
                                  placeholder="HH:MM"
                                  inputMode="numeric"
                                />
                                <div className="time-stepper">
                                  <button
                                    type="button"
                                    className="time-stepper-btn"
                                    onClick={() => stepOpeningTime(slot.day, 'end', 30)}
                                    aria-label="Augmenter de 30 minutes"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="time-stepper-btn"
                                    onClick={() => stepOpeningTime(slot.day, 'end', -30)}
                                    aria-label="Diminuer de 30 minutes"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>,
              'opening-hours-sheet'
            )}
          </div>
          {selectedOpeningDays.length > 0 && (
            <div className="opening-hours-summary">
              {selectedOpeningDays.map((slot) => (
                <span key={slot.day} className="opening-hours-summary-chip">
                  {dayLabels[slot.day] || slot.day}: {slot.start} - {slot.end}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isCastingFigurantRequest && !isProjetsEquipeRequest && (
      <div className="form-group">
        <label className="form-label">Date *</label>
        <button
          type="button"
          className={`date-picker-trigger ${formData.deadline ? 'has-value' : ''}`}
          onClick={() => setIsDatePickerOpen(true)}
        >
          <span>{formatDeadlineLabel(formData.deadline)}</span>
          <CalendarDays size={18} />
        </button>
        {renderBottomSheet(
          isDatePickerOpen,
          () => setIsDatePickerOpen(false),
          '',
          <div className="publish-calendar-panel-content">
            <div className="publish-calendar-header">
              <button
                type="button"
                className="publish-calendar-nav"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                aria-label="Mois précédent"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="publish-calendar-title">{monthLabel}</div>
              <button
                type="button"
                className="publish-calendar-nav"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                aria-label="Mois suivant"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="publish-calendar-grid">
              {weekDays.map((day) => (
                <div key={`weekday-${day}`} className="publish-calendar-weekday">
                  {day}
                </div>
              ))}
              {dayCells.map((dateValue, index) => {
                if (!dateValue) {
                  return <div key={`empty-${index}`} className="publish-calendar-empty" />
                }

                const key = toDateKey(dateValue)
                const isSelected = formData.deadline === key
                const isPast = key < todayKey

                return (
                  <button
                    key={key}
                    type="button"
                    className={`publish-calendar-day ${isSelected ? 'selected' : ''}`}
                    disabled={isPast}
                    onClick={() => {
                      onUpdateFormData({ deadline: key })
                      setIsDatePickerOpen(false)
                    }}
                  >
                    {dateValue.getDate()}
                  </button>
                )
              })}
            </div>
          </div>,
          'publish-calendar-panel'
        )}
      </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isJobCategory && !isProjetsEquipeCategory && !isCastingFigurantRequest && (
      <div className="form-group">
        <label className="form-label">Heure *</label>
        <div className="time-input-row">
          <input
            type="text"
            className="form-input time-input"
            value={formData.neededTime || '01:00'}
            onChange={(e) => onUpdateFormData({ neededTime: normalizeTime(e.target.value) })}
            onBlur={() => onUpdateFormData({ neededTime: formatTime(formData.neededTime || '01:00') })}
            placeholder="HH:MM"
            inputMode="numeric"
            aria-label="Heure"
          />
          <div className="time-stepper">
            <button type="button" className="time-stepper-btn" onClick={() => stepTime(30)} aria-label="Augmenter de 30 minutes">
              <ChevronUp size={16} />
            </button>
            <button type="button" className="time-stepper-btn" onClick={() => stepTime(-30)} aria-label="Diminuer de 30 minutes">
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isJobCategory && !isProjetsEquipeCategory && !isCastingFigurantRequest && (
      <div className="form-group">
        <label className="form-label">Durée estimée (optionnel)</label>
        <div className="time-input-row">
          <input
            type="text"
            className="form-input time-input"
            value={formatDurationValue(formData.duration_minutes)}
            onChange={(e) => {
              const numeric = e.target.value.replace(/[^\d]/g, '')
              onUpdateFormData({ duration_minutes: numeric })
            }}
            placeholder="Durée (en minutes)"
            inputMode="numeric"
            aria-label="Durée estimée"
          />
          <div className="time-stepper">
            <button type="button" className="time-stepper-btn" onClick={() => stepDuration(30)} aria-label="Augmenter de 30 minutes">
              <ChevronUp size={14} />
            </button>
            <button type="button" className="time-stepper-btn" onClick={() => stepDuration(-30)} aria-label="Diminuer de 30 minutes">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
      )}

      {isJobCategory && (
        <div className="form-group">
          <label className="form-label">{isJobRequest ? 'Description de votre profil *' : 'Description du poste *'}</label>
          <textarea
            className="form-textarea"
            placeholder={descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={6}
          />
          <div className="form-field-meta">
            Minimum {MIN_DESCRIPTION_CHARS} caractères ({descriptionLength}/{MIN_DESCRIPTION_CHARS})
          </div>
        </div>
      )}

      {isJobCategory && !isJobRequest && (
        <>
          <div className="form-group">
            <label className="form-label">{isJobRequest ? 'Disponibilités' : 'Horaires / temps de travail *'}</label>
            <input
              type="text"
              className="form-input small-placeholder"
              placeholder={isJobRequest ? 'Ex : 20h/semaine, soirs, week-end...' : 'Ex : 35h/semaine'}
              value={formData.work_schedule || ''}
              onChange={(e) => onUpdateFormData({ work_schedule: e.target.value })}
            />
            <div className="form-field-meta">
              Minimum {MIN_WORK_SCHEDULE_CHARS} caractères ({workScheduleLength}/{MIN_WORK_SCHEDULE_CHARS})
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Missions / responsabilités *</label>
            <textarea
              className="form-textarea"
              placeholder="Décrivez les missions principales du poste."
              value={formData.responsibilities || ''}
              onChange={(e) => onUpdateFormData({ responsibilities: e.target.value })}
              rows={4}
            />
            <div className="form-field-meta">
              Minimum {MIN_RESPONSIBILITIES_CHARS} caractères ({responsibilitiesLength}/{MIN_RESPONSIBILITIES_CHARS})
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Compétences requises *</label>
            <textarea
              className="form-textarea"
              placeholder="Listez les compétences attendues (ex: montage, rédaction, outils...)."
              value={formData.required_skills || ''}
              onChange={(e) => onUpdateFormData({ required_skills: e.target.value })}
              rows={4}
            />
            <div className="form-field-meta">
              Minimum {MIN_REQUIRED_SKILLS_CHARS} caractères ({requiredSkillsLength}/{MIN_REQUIRED_SKILLS_CHARS})
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avantages *</label>
            <textarea
              className="form-textarea"
              placeholder="Ex: télétravail, horaires flexibles, tickets resto..."
              value={formData.benefits || ''}
              onChange={(e) => onUpdateFormData({ benefits: e.target.value })}
              rows={3}
            />
            <div className="form-field-meta">
              Minimum {MIN_BENEFITS_CHARS} caractères ({benefitsLength}/{MIN_BENEFITS_CHARS})
            </div>
          </div>
        </>
      )}

      <button
        className="continue-button"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continuer
      </button>
    </div>
  )
}
