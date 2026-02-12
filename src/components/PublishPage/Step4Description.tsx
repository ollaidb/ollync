import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { shouldShowSocialNetwork, getPaymentOptionsForCategory, getPaymentOptionConfig } from '../../utils/publishHelpers'
import { SOCIAL_NETWORKS_CONFIG } from '../../utils/socialNetworks'
import { CustomList } from '../CustomList/CustomList'
import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
  deadline?: string
  neededTime?: string
  duration_minutes?: string
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
  const showSocialNetwork = shouldShowSocialNetwork(
    selectedCategory?.slug,
    selectedSubcategory?.slug
  )
  const isJobCategory = (selectedCategory?.slug ?? formData.category) === 'emploi'
  const paymentOptions = getPaymentOptionsForCategory(selectedCategory?.slug ?? formData.category)
  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
  const requiresPrice = !!paymentConfig?.requiresPrice
  const requiresExchangeService = !!paymentConfig?.requiresExchangeService
  const requiresRevenueShare = !!paymentConfig?.requiresPercentage
  const showCoCreationDetails = formData.exchange_type === 'co-creation'
  const [isSocialNetworkOpen, setIsSocialNetworkOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [isMaterialConditionOpen, setIsMaterialConditionOpen] = useState(false)

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
    evenements: {
      title: 'Ex : Événement (type d’événement)',
      description:
        'Ex : Type concert/expo/festival/soirée pour une durée de 2 heures et photos + vidéos.'
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
  const castingRoleExamples: Record<string, { title: string; description: string }> = {
    figurant: {
      title: 'Ex : Figurant pour vidéo comédie',
      description:
        'Ex : Je cherche des figurants pour apparaître dans une vidéo comédie. Durée : 2h.'
    },
    'modele-photo': {
      title: 'Ex : Modèle photo pour lookbook',
      description:
        'Ex : Je cherche un modèle photo pour un shooting mode (vêtements/chaussures). Durée : 2h.'
    },
    'modele-video': {
      title: 'Ex : Modèle vidéo pour clip',
      description:
        'Ex : Je cherche un modèle vidéo pour apparaître dans un clip/vidéo créative. Durée : 3h.'
    },
    'voix-off': {
      title: 'Ex : Voix off pour vidéo promo',
      description:
        'Ex : Je cherche une voix off pour une vidéo promo (1 à 2 minutes).'
    },
    'invite-podcast': {
      title: 'Ex : Invité podcast (thème)',
      description:
        'Ex : Je cherche un invité pour parler d’un thème précis dans un podcast. Durée : 45 min.'
    },
    'invite-micro-trottoir': {
      title: 'Ex : Micro‑trottoir (thème)',
      description:
        'Ex : Je cherche des personnes à interviewer dans la rue sur un thème précis. Durée : 10 min.'
    },
    'youtube-video': {
      title: 'Ex : Vidéo YouTube (type de vidéo)',
      description:
        'Ex : Je cherche un invité pour une vidéo YouTube (débat/interview/concept). Durée : 1h.'
    },
    autre: {
      title: 'Ex : Autre rôle',
      description:
        'Ex : Décrivez le rôle ou le profil recherché si vous ne trouvez pas la sous‑catégorie.'
    }
  }
  const emploiExamples: Record<string, { title: string; description: string }> = {
    montage: {
      title: 'Ex : Je cherche un monteur vidéo',
      description:
        'Ex : Je cherche un monteur pour des vidéos courtes/longues (montage, rythme, export).'
    },
    'micro-trottoir': {
      title: 'Ex : Micro‑trottoir (thème)',
      description:
        'Ex : Je cherche une personne pour réaliser un micro‑trottoir sur un thème précis.'
    },
    'community-manager': {
      title: 'Ex : Je cherche un community manager',
      description:
        'Ex : Je cherche un community manager pour gérer les réseaux (posts, réponses, animation).'
    },
    live: {
      title: 'Ex : Je cherche un animateur live',
      description:
        'Ex : Je cherche quelqu’un pour animer des lives et présenter des produits/contenus.'
    },
    'ecriture-contenu': {
      title: 'Ex : Je cherche un rédacteur contenu',
      description:
        'Ex : Je cherche une personne pour écrire des scripts, idées et captions.'
    },
    scenariste: {
      title: 'Ex : Je cherche un scénariste',
      description:
        'Ex : Je cherche un scénariste pour écrire des scripts et scénarios de vidéos.'
    },
    autre: {
      title: 'Ex : Autre poste',
      description:
        'Ex : Décrivez le poste recherché si vous ne trouvez pas la sous‑catégorie.'
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
  const creationExample = creationContenuExamples[subcategorySlug]
  const castingExample = castingRoleExamples[subcategorySlug]
  const emploiExample = emploiExamples[subcategorySlug]
  const servicesExample = servicesExamples[subcategorySlug]
  const venteExample = venteExamples[subcategorySlug]
  const posteServiceExample = posteServiceExamples[subcategorySlug]
  const studioLieuExample = studioLieuExamples[subcategorySlug]
  const projetsExample = projetsExamples[subcategorySlug]
  const activeExample =
    categorySlug === 'creation-contenu'
      ? creationExample
      : categorySlug === 'casting-role'
        ? castingExample
        : categorySlug === 'emploi'
          ? emploiExample
          : categorySlug === 'services'
            ? servicesExample
            : categorySlug === 'vente'
              ? venteExample
              : categorySlug === 'poste-service'
                ? posteServiceExample
                : categorySlug === 'studio-lieu'
                  ? studioLieuExample
                  : categorySlug === 'projets-equipe'
                    ? projetsExample
                : undefined
  const titlePlaceholder = activeExample?.title ?? 'Ex: Développeur React recherché'
  const descriptionPlaceholder = isJobCategory
    ? 'Décris le poste, les missions, les compétences requises, le profil recherché et les avantages.'
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
  
  // Validation complète des champs obligatoires de cette étape
  const canContinue = 
    formData.title.trim().length > 0 && 
    formData.description.trim().length > 0 &&
    (!isJobCategory || (formData.contract_type && formData.contract_type.trim().length > 0)) &&
    formData.exchange_type.trim().length > 0 &&
    (!requiresPrice || (formData.price && parseFloat(formData.price) > 0)) &&
    (!requiresExchangeService || (formData.exchange_service && formData.exchange_service.trim().length > 0)) &&
    (!requiresRevenueShare || (
      formData.revenue_share_percentage && 
      !Number.isNaN(parseFloat(formData.revenue_share_percentage)) &&
      parseFloat(formData.revenue_share_percentage) > 0 &&
      parseFloat(formData.revenue_share_percentage) <= 100
    )) &&
    (!isMaterialSale || (formData.materialCondition && formData.materialCondition.trim().length > 0)) &&
    (!showSocialNetwork || (formData.socialNetwork && formData.socialNetwork.trim().length > 0))

  return (
    <div className="step4-description">
      <h2 className="step-title">Décrivez votre annonce</h2>
      
      <div className="form-group">
        <label className="form-label">Titre *</label>
        <input
          type="text"
          className="form-input"
          placeholder={titlePlaceholder}
          value={formData.title}
          onChange={(e) => onUpdateFormData({ title: e.target.value })}
        />
      </div>

      {isJobCategory && (
        <>
          <div className="form-group dropdown-field">
            <label className="form-label">Type de contrat *</label>
            <button
              type="button"
              className={`dropdown-trigger ${isContractOpen ? 'open' : ''}`}
              onClick={() => setIsContractOpen((prev) => !prev)}
            >
              <span>{selectedContractName}</span>
              <span className="dropdown-caret" aria-hidden="true" />
            </button>
            {isContractOpen && (
              <>
                <div
                  className="publish-dropdown-backdrop"
                  onClick={() => setIsContractOpen(false)}
                />
                <div className="publish-dropdown-panel">
                  <div className="publish-dropdown-title">Choisissez un type de contrat</div>
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
                </div>
              </>
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
          {isSocialNetworkOpen && (
            <>
              <div
                className="publish-dropdown-backdrop"
                onClick={() => setIsSocialNetworkOpen(false)}
              />
              <div className="publish-dropdown-panel">
                <div className="publish-dropdown-title">Choisissez un réseau social</div>
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
              </div>
            </>
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
          {isMaterialConditionOpen && (
            <>
              <div
                className="publish-dropdown-backdrop"
                onClick={() => setIsMaterialConditionOpen(false)}
              />
              <div className="publish-dropdown-panel">
                <div className="publish-dropdown-title">Choisissez un état du matériel</div>
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
              </div>
            </>
          )}
        </div>
      )}

      {/* Moyen de paiement - Visible pour toutes les catégories */}
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
        {isPaymentOpen && (
          <>
            <div
              className="publish-dropdown-backdrop"
              onClick={() => setIsPaymentOpen(false)}
            />
            <div className="publish-dropdown-panel">
              <div className="publish-dropdown-title">Choisissez un moyen de paiement</div>
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
              />
            </div>
          </>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Date de besoin *</label>
        <input
          type="date"
          className="form-input"
          value={formData.deadline || ''}
          onChange={(e) => onUpdateFormData({ deadline: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Heure de besoin *</label>
        <div className="time-input-row">
          <input
            type="text"
            className="form-input time-input"
            value={formData.neededTime || '01:00'}
            onChange={(e) => onUpdateFormData({ neededTime: normalizeTime(e.target.value) })}
            onBlur={() => onUpdateFormData({ neededTime: formatTime(formData.neededTime || '01:00') })}
            placeholder="HH:MM"
            inputMode="numeric"
            aria-label="Heure de besoin"
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

      {requiresPrice && (
        <div className="form-group">
          <label className="form-label">{isJobCategory ? 'Rémunération *' : 'Prix *'}</label>
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

      {isJobCategory && (
        <div className="form-group">
          <label className="form-label">Description du poste *</label>
          <textarea
            className="form-textarea"
            placeholder={descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={6}
          />
        </div>
      )}

      {isJobCategory && (
        <>
          <div className="form-group">
            <label className="form-label">Horaires / temps de travail</label>
            <input
              type="text"
              className="form-input small-placeholder"
              placeholder="Ex : 35h/semaine"
              value={formData.work_schedule || ''}
              onChange={(e) => onUpdateFormData({ work_schedule: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Missions / responsabilités</label>
            <textarea
              className="form-textarea"
              placeholder="Décrivez les missions principales du poste."
              value={formData.responsibilities || ''}
              onChange={(e) => onUpdateFormData({ responsibilities: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Compétences requises</label>
            <textarea
              className="form-textarea"
              placeholder="Listez les compétences attendues (ex: montage, rédaction, outils...)."
              value={formData.required_skills || ''}
              onChange={(e) => onUpdateFormData({ required_skills: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avantages</label>
            <textarea
              className="form-textarea"
              placeholder="Ex: télétravail, horaires flexibles, tickets resto..."
              value={formData.benefits || ''}
              onChange={(e) => onUpdateFormData({ benefits: e.target.value })}
              rows={3}
            />
          </div>
        </>
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
