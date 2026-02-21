import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { getPublicationTypesWithSubSubCategories } from '../utils/publishDataConverter'
import { usePublishNavigation } from '../hooks/usePublishNavigation'
import { useExamplePosts } from '../hooks/useExamplePosts'
import { handlePublish, validatePublishForm, shouldShowSocialNetwork, getPaymentOptionConfig } from '../utils/publishHelpers'
import { useAuth } from '../hooks/useSupabase'
import { useToastContext } from '../contexts/ToastContext'
import { PublishHeader } from '../components/PublishPage/PublishHeader'
import { PublishGuideModal } from '../components/PublishPage/PublishGuideModal'
import { Step0OfferDemand, type OfferDemandType } from '../components/PublishPage/Step0OfferDemand'
import { Step1Category } from '../components/PublishPage/Step1Category'
import { Step2Subcategory } from '../components/PublishPage/Step2Subcategory'
import { Step3Option } from '../components/PublishPage/Step3Option'
import { Step3Platform } from '../components/PublishPage/Step3Platform'
import { Step4Description } from '../components/PublishPage/Step4Description'
import { Step5LocationMedia } from '../components/PublishPage/Step5LocationMedia'
import { PublishActions } from '../components/PublishPage/PublishActions'
import { supabase } from '../lib/supabaseClient'
import './Publish.css'

export default function Publish() {
  type DraftPost = {
    id: string
    category_id?: string | null
    sub_category_id?: string | null
    title?: string | null
    description?: string | null
    price?: number | null
    contract_type?: string | null
    work_schedule?: string | null
    responsibilities?: string | null
    required_skills?: string | null
    benefits?: string | null
    location?: string | null
    location_city?: string | null
    location_lat?: number | null
    location_lng?: number | null
    location_address?: string | null
    location_visible_to_participants_only?: boolean | null
    event_mode?: 'in_person' | 'remote' | null
    event_platform?: string | null
    payment_type?: string | null
    exchange_service?: string | null
    revenue_share_percentage?: number | string | null
    co_creation_details?: string | null
    is_urgent?: boolean | null
    images?: string[] | null
    video?: string | null
    needed_date?: string | null
    needed_time?: string | null
    number_of_people?: number | null
    duration_minutes?: number | null
    profile_level?: string | null
    profile_roles?: string[] | null
    visibility?: string | null
    external_link?: string | null
    document_url?: string | null
    media_type?: string | null
    listing_type?: string | null
    dateFrom?: string | null
    dateTo?: string | null
    tagged_post_id?: string | null
    opening_hours?: Array<{ day: string; enabled: boolean; start: string; end: string }> | null
    billing_hours?: number | null
  }
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { showSuccess } = useToastContext()
  
  // Récupérer les catégories enrichies avec les niveaux 3 et 4
  const enrichedPublicationTypes = useMemo(() => {
    return getPublicationTypesWithSubSubCategories()
  }, [])

  const initialFormData = useMemo(() => ({
    listingType: '' as OfferDemandType | '',
    category: null as string | null,
    subcategory: null as string | null,
    subSubCategory: null as string | null, // N3
    subSubSubCategory: null as string | null, // N4
    option: null as string | null,
    platform: null as string | null,
    title: '',
    description: '',
    socialNetwork: undefined as string | undefined,
    price: '',
    contract_type: '',
    work_schedule: '',
    responsibilities: '',
    required_skills: '',
    benefits: '',
    location: '',
    location_city: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    location_address: '',
    location_visible_to_participants_only: false,
    event_mode: '' as '' | 'in_person' | 'remote',
    event_platform: '',
    exchange_type: '',
    exchange_service: '',
    revenue_share_percentage: '',
    co_creation_details: '',
    materialCondition: '',
    urgent: false,
    images: [] as string[],
    video: null as string | null,
    dateFrom: '',
    dateTo: '',
    deadline: '',
    neededTime: '01:00',
    maxParticipants: '1',
    profileLevel: '',
    profileRoles: [] as string[],
    duration_minutes: '',
    visibility: 'public',
    externalLink: '',
    documentUrl: '',
    documentName: '',
    taggedPostId: '',
    businessOpeningHours: [
      { day: 'lundi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'mardi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'mercredi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'jeudi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'vendredi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'samedi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'dimanche', enabled: false, start: '09:00', end: '18:00' }
    ],
    billingHours: ''
  }), [])
  const [formData, setFormData] = useState(initialFormData)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const editPostId = searchParams.get('edit')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const { step, setStep, handleBack, getBreadcrumb } = usePublishNavigation(
    formData,
    (updates) => setFormData({ ...formData, ...updates })
  )

  const selectedCategory = enrichedPublicationTypes.find(
    (c) => c.id === formData.category,
  )

  const selectedSubcategory = selectedCategory?.subcategories.find(
    (s) => s.id === formData.subcategory,
  )
  const isVenteCategory = selectedCategory?.slug === 'vente'
  const isEmploiCategory = selectedCategory?.slug === 'emploi'

  // N3 : Sous-sous-catégorie (option dans la structure actuelle)
  const selectedSubSubCategory = selectedSubcategory?.options?.find(
    (o) => o.id === formData.subSubCategory || o.id === formData.option,
  )

  // N4 : Sous-sous-sous-catégorie (platform dans la structure actuelle)
  const selectedSubSubSubCategory = selectedSubSubCategory?.platforms?.find(
    (p) => p.id === formData.subSubSubCategory || p.id === formData.platform,
  )

  // Récupérer les slugs pour useExamplePosts
  const categorySlug = selectedCategory?.slug || null
  const subcategorySlug = selectedSubcategory?.slug || null
  const subSubCategorySlug = selectedSubSubCategory?.id || null
  const subSubSubCategorySlug = selectedSubSubSubCategory?.id || null

  const { examplePosts, loadingPosts } = useExamplePosts(
    categorySlug,
    subcategorySlug,
    subSubCategorySlug,
    subSubSubCategorySlug
  )

  const parseDocumentNameFromUrl = (url?: string | null) => {
    if (!url) return ''
    const hash = url.split('#')[1]
    if (!hash) return ''
    const params = new URLSearchParams(hash)
    return params.get('name') || ''
  }

  const parseMaterialConditionFromDescription = (description?: string | null) => {
    if (!description) return ''
    const match = description.match(/État du matériel\s*:\s*(.+)$/mi)
    return match?.[1]?.trim() || ''
  }

  const formatMinutesToTime = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return ''
    const normalized = Math.max(0, Math.floor(value))
    const hours = Math.floor(normalized / 60)
    const minutes = normalized % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const getStepFromForm = useCallback((data: typeof formData) => {
    if (!data.listingType) return 0
    if (!data.category) return 1
    if (!data.subcategory) return 2

    const category = enrichedPublicationTypes.find((c) => c.id === data.category)
    const subcategory = category?.subcategories.find((s) => s.id === data.subcategory)

    if (subcategory?.options && subcategory.options.length > 0 && !data.subSubCategory && !data.option) {
      return 3
    }

    const selectedOption = subcategory?.options?.find(
      (o) => o.id === data.subSubCategory || o.id === data.option
    )

    if (selectedOption?.platforms && selectedOption.platforms.length > 0 && !data.subSubSubCategory && !data.platform) {
      return 3.5
    }

    const showSocialNetwork = shouldShowSocialNetwork(category?.slug, subcategory?.slug)
    const paymentConfig = getPaymentOptionConfig(data.exchange_type)
    const isJobRequest = category?.slug === 'emploi' && data.listingType === 'request'
    const requiresPrice = !isJobRequest && !!paymentConfig?.requiresPrice
    const requiresExchangeService = !isJobRequest && !!paymentConfig?.requiresExchangeService
    const requiresRevenueShare = !isJobRequest && !!paymentConfig?.requiresPercentage
    const requiresMaterialCondition =
      category?.slug === 'vente' && subcategory?.slug === 'gorille'

    const hasStep3Required =
      data.title.trim().length > 0 &&
      data.description.trim().length > 0 &&
      (isJobRequest || data.exchange_type.trim().length > 0) &&
      (!requiresPrice || (data.price && parseFloat(data.price) > 0)) &&
      (!requiresExchangeService || (data.exchange_service && data.exchange_service.trim().length > 0)) &&
      (!requiresRevenueShare ||
        (data.revenue_share_percentage &&
          !Number.isNaN(parseFloat(data.revenue_share_percentage)) &&
          parseFloat(data.revenue_share_percentage) > 0 &&
          parseFloat(data.revenue_share_percentage) <= 100)) &&
      (!requiresMaterialCondition || (data.materialCondition && data.materialCondition.trim().length > 0)) &&
      (!showSocialNetwork || (data.socialNetwork && data.socialNetwork.trim().length > 0))

    if (!hasStep3Required) return 4
    return 5
  }, [enrichedPublicationTypes])

  useEffect(() => {
    const isJobRequest = isEmploiCategory && formData.listingType === 'request'
    if (isJobRequest) return
    if (!isVenteCategory && !isEmploiCategory) return
    if (formData.exchange_type === 'remuneration') return
    setFormData((prev) => ({
      ...prev,
      exchange_type: 'remuneration',
      exchange_service: '',
      revenue_share_percentage: '',
      co_creation_details: ''
    }))
  }, [isVenteCategory, isEmploiCategory, formData.listingType, formData.exchange_type])

  useEffect(() => {
    if (!editPostId || !user) return
    let isMounted = true

    const loadDraft = async () => {
      setIsLoadingEdit(true)
      const storedStepRaw = editPostId ? Number(localStorage.getItem(`publishDraftStep:${editPostId}`)) : null
      const validStoredStep =
        storedStepRaw !== null && [0, 1, 2, 3, 3.5, 4, 5].includes(storedStepRaw) ? (storedStepRaw as number) : null
      if (validStoredStep !== null) {
        setStep(validStoredStep)
      }
      const cachedDraftRaw = editPostId ? localStorage.getItem(`publishDraftData:${editPostId}`) : null
      if (cachedDraftRaw) {
        try {
          const cachedDraft = JSON.parse(cachedDraftRaw)
          if (cachedDraft && typeof cachedDraft === 'object') {
            setFormData({ ...initialFormData, ...cachedDraft })
          }
        } catch {
          localStorage.removeItem(`publishDraftData:${editPostId}`)
        }
      }
      try {
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser?.user) {
          return
        }

        const { data: postDataRaw, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', editPostId)
          .eq('user_id', authUser.user.id)
          .maybeSingle()

        if (postError || !isMounted) {
          console.error('Error loading post for edit:', postError)
          return
        }
        if (!postDataRaw) {
          return
        }

        const postData = postDataRaw as DraftPost

        const [{ data: categoryData }, { data: subCategoryData }] = await Promise.all([
          postData.category_id
            ? supabase.from('categories').select('slug').eq('id', postData.category_id).single()
            : Promise.resolve({ data: null }),
          postData.sub_category_id
            ? supabase.from('sub_categories').select('slug').eq('id', postData.sub_category_id).single()
            : Promise.resolve({ data: null })
        ])

        const categorySlugValue = (categoryData as { slug?: string } | null)?.slug || null
        const subcategorySlugValue = (subCategoryData as { slug?: string } | null)?.slug || (categorySlugValue ? 'tout' : null)

        const shouldUseSocialNetwork = shouldShowSocialNetwork(categorySlugValue, subcategorySlugValue)
        const mediaTypeValue = postData.media_type || ''

        const nextFormData = {
          listingType: ((postData.listing_type as OfferDemandType | null) || 'offer') as OfferDemandType,
          category: categorySlugValue,
          subcategory: subcategorySlugValue,
          subSubCategory: shouldUseSocialNetwork ? null : (mediaTypeValue || null),
          subSubSubCategory: null,
          option: shouldUseSocialNetwork ? null : (mediaTypeValue || null),
          platform: null,
          title: postData.title || '',
          description: postData.description || '',
          socialNetwork: shouldUseSocialNetwork ? (mediaTypeValue || '') : undefined,
          price: postData.price ? String(postData.price) : '',
          contract_type: postData.contract_type || '',
          work_schedule: postData.work_schedule || '',
          responsibilities: postData.responsibilities || '',
          required_skills: postData.required_skills || '',
          benefits: postData.benefits || '',
          location: postData.location || '',
          location_city: postData.location_city || '',
          location_lat: postData.location_lat ?? null,
          location_lng: postData.location_lng ?? null,
          location_address: postData.location_address || '',
          location_visible_to_participants_only: postData.location_visible_to_participants_only || false,
          event_mode: (
            postData.event_mode === 'in_person' || postData.event_mode === 'remote'
              ? postData.event_mode
              : ''
          ) as '' | 'in_person' | 'remote',
          event_platform: postData.event_platform || '',
          exchange_type: postData.payment_type || '',
          exchange_service: postData.exchange_service || '',
          revenue_share_percentage: postData.revenue_share_percentage ? String(postData.revenue_share_percentage) : '',
          co_creation_details: postData.co_creation_details || '',
          materialCondition: parseMaterialConditionFromDescription(postData.description),
          urgent: postData.is_urgent || false,
          images: postData.images || [],
          video: postData.video || null,
          dateFrom: postData.dateFrom || '',
          dateTo: postData.dateTo || '',
          deadline: postData.needed_date || '',
          neededTime: postData.needed_time || '01:00',
          maxParticipants: postData.number_of_people ? String(postData.number_of_people) : '1',
          profileLevel: postData.profile_level || '',
          profileRoles: postData.profile_roles || [],
          duration_minutes: postData.duration_minutes != null ? String(postData.duration_minutes) : '',
          visibility: postData.visibility || 'public',
          externalLink: postData.external_link || '',
          documentUrl: postData.document_url || '',
          documentName: parseDocumentNameFromUrl(postData.document_url),
          taggedPostId: postData.tagged_post_id || '',
          businessOpeningHours: Array.isArray(postData.opening_hours) && postData.opening_hours.length > 0
            ? postData.opening_hours
            : initialFormData.businessOpeningHours,
          billingHours: formatMinutesToTime(postData.billing_hours)
        }

        if (!isMounted) return
        setFormData(nextFormData)

        setStep(validStoredStep ?? getStepFromForm(nextFormData))
      } catch (error) {
        console.error('Error loading edit data:', error)
      } finally {
        if (isMounted) setIsLoadingEdit(false)
      }
    }

    loadDraft()

    return () => {
      isMounted = false
    }
  }, [editPostId, user, setStep, getStepFromForm, initialFormData])

  useEffect(() => {
    if (!editPostId) return
    localStorage.setItem(`publishDraftStep:${editPostId}`, String(step))
  }, [editPostId, step])

  useEffect(() => {
    if (!editPostId) return
    localStorage.setItem(`publishDraftData:${editPostId}`, JSON.stringify(formData))
  }, [editPostId, formData])

  // Validation des champs obligatoires
  const requireSocialNetwork = shouldShowSocialNetwork(categorySlug, subcategorySlug)
  const validation = useMemo(() => {
    return validatePublishForm(formData, requireSocialNetwork)
  }, [formData, requireSocialNetwork])

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData({ ...formData, ...updates })
  }

  const handlePublishPost = (status: 'draft' | 'active') => {
    const showToastMessage = (message: string) => {
      showSuccess(message)
    }
    handlePublish(formData, navigate, status, showToastMessage, editPostId)
  }

  if (!user) {
    return (
      <div className="publish-page-container">
        <div className="publish-header-not-connected">
          <h1 className="publish-title-centered">Publier</h1>
        </div>
        <div className="publish-content-not-connected">
          <PlusCircle className="publish-not-connected-icon" strokeWidth={1.5} />
          <h2 className="publish-not-connected-title">Vous n'êtes pas connecté</h2>
          <p className="publish-not-connected-text">Connectez-vous pour publier une annonce</p>
          <button 
            className="publish-not-connected-button" 
            onClick={() => navigate('/auth/register')}
          >
            S'inscrire
          </button>
          <p className="publish-not-connected-login-link">
            Déjà un compte ?{' '}
            <button 
              className="publish-not-connected-link" 
              onClick={() => navigate('/auth/login')}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingEdit) {
    return (
      <div className="publish-page-container">
        <div className="publish-content-wrapper">
          <div className="publish-content">
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="publish-page-container">
      {/* Header */}
      <div className="publish-header-wrapper">
        <PublishHeader
          step={step}
          onBack={handleBack}
          breadcrumb={getBreadcrumb(
            selectedCategory,
            selectedSubcategory,
            selectedSubSubCategory,
            selectedSubSubSubCategory,
          )}
          selectedCategory={selectedCategory || undefined}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      </div>

      <div className={`publish-content-wrapper ${step === 5 ? 'has-actions' : 'no-actions'}`}>
        <div className="publish-content">
          {step === 0 && (
            <Step0OfferDemand
              value={formData.listingType || null}
              onSelect={(listingType) => {
                updateFormData({ listingType })
                setStep(1)
              }}
            />
          )}

          {step === 1 && (
            <Step1Category
              listingType={formData.listingType}
              onSelectCategory={(categoryId) => {
                updateFormData({ category: categoryId })
                setStep(2)
              }}
            />
          )}

          {step === 2 && (
            <Step2Subcategory
              selectedCategory={selectedCategory ?? null}
              listingType={formData.listingType}
              onSelectSubcategory={(subcategoryId) => {
                updateFormData({ 
                  subcategory: subcategoryId,
                  subSubCategory: null,
                  subSubSubCategory: null,
                  option: null,
                  platform: null
                })
                const subcategory = selectedCategory?.subcategories.find(
                  (s) => s.id === subcategoryId
                )
                // Si cette sous-catégorie a des options (N3), aller à l'étape 2
                if (subcategory?.options && subcategory.options.length > 0) {
                  setStep(3)
                } else {
                  // Sinon, aller directement à la description
                  setStep(4)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 3 && !formData.subSubCategory && (
            <Step3Option
              selectedSubcategory={selectedSubcategory ?? null}
              selectedCategory={selectedCategory ?? null}
              onSelectOption={(opt) => {
                updateFormData({ 
                  subSubCategory: opt.id,
                  option: opt.id, // Pour compatibilité
                  subSubSubCategory: null,
                  platform: null
                })
                // Si cette option (N3) a des platforms (N4), aller à l'étape 2.5
                if (opt.platforms && opt.platforms.length > 0) {
                  setStep(3.5)
                } else {
                  // Sinon, aller directement à la description
                  setStep(4)
                }
              }}
              examplePosts={examplePosts}
              loadingPosts={loadingPosts}
            />
          )}

          {step === 3.5 && (
            <Step3Platform
              selectedOption={selectedSubSubCategory ?? null}
              onSelectPlatform={(platform) => {
                updateFormData({ 
                  subSubSubCategory: platform,
                  platform: platform // Pour compatibilité
                })
                setStep(4)
              }}
            />
          )}

          {step === 4 && (
            <Step4Description
              formData={formData}
              onUpdateFormData={updateFormData}
              onContinue={() => setStep(5)}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
            />
          )}

          {step === 5 && (
            <Step5LocationMedia
              formData={formData}
              onUpdateFormData={updateFormData}
              currentPostId={editPostId}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {step === 5 && (
        <PublishActions
          selectedCategory={selectedCategory ?? null}
          onSaveDraft={() => handlePublishPost('draft')}
          onPreview={() => {}}
          onPublish={() => handlePublishPost('active')}
          isValid={validation.isValid}
        />
      )}

      <PublishGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  )
}
