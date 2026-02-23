import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { MouseEvent, TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Users, Download, AlertCircle, Eye, Trash2, Share2, Search, Send, ChevronDown } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConfirmation } from '../../hooks/useConfirmation'
import { useToastContext } from '../../contexts/ToastContext'
import ConfirmationModal from '../../components/ConfirmationModal'
import { EmptyState } from '../../components/EmptyState'
import { CustomList } from '../../components/CustomList/CustomList'
import type { Database } from '../../types/database'
import { getAllPaymentOptions, getPaymentOptionConfig } from '../../utils/publishHelpers'
import './Contracts.css'

const SYSTEM_SENDER_EMAIL = 'binta22116@gmail.com'
const extractContractNameFromContent = (content?: string | null) => {
  const raw = String(content || '')
  const match = raw.match(/Nom du contrat\s*:\s*(.+)/i)
  return match?.[1]?.trim() || ''
}
const getDraftDisplayName = (draft: ContractDraftSnapshot | null | undefined) => {
  const snapshot = draft || {}
  const contractName = String(snapshot.contract_name || '').trim()
  if (contractName) return contractName
  const selectedOption = String(snapshot.selected_option || '')
  return selectedOption ? `Brouillon • ${selectedOption.replace(':', ' ')}` : 'Brouillon sans titre'
}

interface ProfileSummary {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
  phone?: string | null
  contract_full_name?: string | null
  contract_email?: string | null
  contract_phone?: string | null
  contract_city?: string | null
  contract_country?: string | null
  contract_siren?: string | null
  contract_signature?: string | null
  contract_default_type?: string | null
}

interface PostSummary {
  id: string
  title: string
  description?: string | null
  status?: string | null
  payment_type?: string | null
  price?: number | null
  visibilite_offer_type?: 'visibilite' | 'service' | null
  visibilite_service_details?: string | null
  revenue_share_percentage?: number | null
  co_creation_details?: string | null
  number_of_people?: number | null
  user_id: string
  created_at?: string
}

interface ApplicationSummary {
  id: string
  post_id: string
  applicant_id: string
  status: string
  created_at: string
  applicant?: ProfileSummary | null
}

interface ContractRecord {
  id: string
  post_id: string | null
  application_id: string | null
  creator_id: string
  counterparty_id: string
  contract_type: string
  payment_type: string | null
  price: number | null
  revenue_share_percentage: number | null
  exchange_service: string | null
  contract_content: string
  custom_clauses: string | null
  status: string
  agreement_confirmed: boolean
  created_at: string
  creator_opened_at?: string | null
  counterparty_opened_at?: string | null
  creator_accepted_at?: string | null
  counterparty_accepted_at?: string | null
  post?: { title?: string | null } | null
  counterparty?: ProfileSummary | null
  creator?: ProfileSummary | null
}

interface ContractShareConversation {
  id: string
  user1_id?: string | null
  user2_id?: string | null
  last_message_at?: string | null
  other_user?: ProfileSummary | null
}

type SelectedContext =
  | { mode: 'owner'; post: PostSummary }
  | { mode: 'applicant'; post: PostSummary; application: ApplicationSummary; owner: ProfileSummary }

interface ContractProfileForm {
  fullName: string
  email: string
  phone: string
  city: string
  country: string
  siren: string
  signature: string
}

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

interface ContractDraftSnapshot {
  contract_name?: string
  selected_option?: string
  contract_type?: string
  selected_payment_type?: string
  price_value?: string
  revenue_share?: string
  exchange_service?: string
  visibilite_offer_type?: 'visibilite' | 'service' | ''
  visibilite_service_details?: string
  co_creation_details?: string
  custom_clauses?: string
  custom_articles?: string[]
  agreement_confirmed?: boolean
  default_articles?: { title: string; content: string }[]
  selected_applicants?: Record<string, boolean>
}

interface ContractDraftRow {
  id: string
  draft: ContractDraftSnapshot
  updated_at: string
}

const Contracts = () => {
  const { user } = useAuth()
  const { showSuccess } = useToastContext()
  const confirmation = useConfirmation()
  const [searchParams] = useSearchParams()
  const counterpartyParam = searchParams.get('counterparty')
  const sharedContractParam = searchParams.get('contract')
  const draftParam = searchParams.get('draft')
  const draftNameParam = searchParams.get('draftName')
  const shouldAcceptSharedContract = searchParams.get('acceptContract') === '1'
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileSummary | null>(null)

  const [ownedPosts, setOwnedPosts] = useState<PostSummary[]>([])
  const [acceptedApplications, setAcceptedApplications] = useState<ApplicationSummary[]>([])
  const [acceptedAsApplicant, setAcceptedAsApplicant] = useState<ApplicationSummary[]>([])
  const [applicantPostMap, setApplicantPostMap] = useState<Record<string, PostSummary>>({})
  const [ownerProfileMap, setOwnerProfileMap] = useState<Record<string, ProfileSummary>>({})

  const [selectedOption, setSelectedOption] = useState<string>('')
  const [selectedApplicants, setSelectedApplicants] = useState<Record<string, boolean>>({})
  const [contractType, setContractType] = useState<string>('auto')
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('')
  const [contractName, setContractName] = useState<string>('')
  const [priceValue, setPriceValue] = useState<string>('')
  const [revenueShare, setRevenueShare] = useState<string>('')
  const [exchangeService, setExchangeService] = useState<string>('')
  const [visibiliteOfferType, setVisibiliteOfferType] = useState<'' | 'visibilite' | 'service'>('')
  const [visibiliteServiceDetails, setVisibiliteServiceDetails] = useState<string>('')
  const [coCreationDetails, setCoCreationDetails] = useState<string>('')
  const [customClauses, setCustomClauses] = useState<string>('')
  const [customArticles, setCustomArticles] = useState<string[]>([''])
  const [defaultArticles, setDefaultArticles] = useState<{ title: string; content: string }[]>([])
  const [hasDefaultArticlesCustom, setHasDefaultArticlesCustom] = useState(false)
  const [showDefaultArticles, setShowDefaultArticles] = useState(false)
  const [agreementConfirmed, setAgreementConfirmed] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const skipNextDraftSave = useRef(false)

  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [preferredCounterpartyId, setPreferredCounterpartyId] = useState<string | null>(null)
  const [contractProfile, setContractProfile] = useState<ContractProfileForm>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    siren: '',
    signature: ''
  })
  const [contractProfileSaving, setContractProfileSaving] = useState(false)
  const [contractProfileSaved, setContractProfileSaved] = useState(false)
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const signaturePointRef = useRef<{ x: number; y: number } | null>(null)
  const [isDrawingSignature, setIsDrawingSignature] = useState(false)
  const [signatureHasData, setSignatureHasData] = useState(false)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [showContractIntro, setShowContractIntro] = useState(false)
  const [drafts, setDrafts] = useState<ContractDraftRow[]>([])
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [handledSharedContractPrompt, setHandledSharedContractPrompt] = useState<string | null>(null)
  const [handledDraftParam, setHandledDraftParam] = useState<string | null>(null)
  const [handledDraftNameParam, setHandledDraftNameParam] = useState<string | null>(null)
  const [hydratedSharedContractId, setHydratedSharedContractId] = useState<string | null>(null)
  const [handledMissingLinkedContract, setHandledMissingLinkedContract] = useState<string | null>(null)
  const [contractPostSearch, setContractPostSearch] = useState('')
  const [showPostPicker, setShowPostPicker] = useState(false)
  const [showPaymentPicker, setShowPaymentPicker] = useState(false)
  const [showVisibiliteOfferTypePicker, setShowVisibiliteOfferTypePicker] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareConversationsLoading, setShareConversationsLoading] = useState(false)
  const [shareConversationSearch, setShareConversationSearch] = useState('')
  const [shareConversations, setShareConversations] = useState<ContractShareConversation[]>([])
  const [selectedShareConversationId, setSelectedShareConversationId] = useState<string | null>(null)
  const [sharingContract, setSharingContract] = useState(false)
  const [showDraftsPanel, setShowDraftsPanel] = useState(false)
  const [showContractPreviewPanel, setShowContractPreviewPanel] = useState(true)
  const [postSelectionWarning, setPostSelectionWarning] = useState(false)

  const selectedContext = useMemo<SelectedContext | null>(() => {
    if (!selectedOption) return null
    const [mode, value] = selectedOption.split(':')
    if (mode === 'owner') {
      const post = ownedPosts.find((item) => item.id === value)
      return post ? { mode: 'owner' as const, post } : null
    }
    if (mode === 'applicant') {
      const application = acceptedAsApplicant.find((item) => item.id === value)
      const post = application ? applicantPostMap[application.post_id] : null
      const owner = post ? ownerProfileMap[post.user_id] : null
      if (!application || !post || !owner) return null
      return { mode: 'applicant' as const, post, application, owner }
    }
    return null
  }, [acceptedAsApplicant, applicantPostMap, ownedPosts, ownerProfileMap, selectedOption])

  useEffect(() => {
    if (selectedContext) {
      setPostSelectionWarning(false)
    }
  }, [selectedContext])

  const flagMissingPostSelection = () => {
    setPostSelectionWarning(true)
    setError('Sélectionnez une annonce avant d’envoyer le contrat.')
    window.setTimeout(() => {
      setPostSelectionWarning(false)
    }, 1800)
  }

  const paymentOptions = useMemo(
    () => getAllPaymentOptions().filter((option) => option.id !== 'prix'),
    []
  )
  const visibiliteOfferTypeOptions = useMemo(
    () => [
      { id: 'visibilite', name: 'Visibilité', description: 'Tu offres une mention, un crédit ou une mise en avant.' },
      { id: 'service', name: 'Service', description: 'Tu offres une prestation ou un service en échange.' }
    ],
    []
  )

  const filteredOwnedPosts = useMemo(() => {
    const query = contractPostSearch.trim().toLowerCase()
    if (!query) return ownedPosts
    return ownedPosts.filter((post) => (post.title || '').toLowerCase().includes(query))
  }, [contractPostSearch, ownedPosts])

  const filteredShareConversations = useMemo(() => {
    const query = shareConversationSearch.trim().toLowerCase()
    if (!query) return shareConversations
    return shareConversations.filter((conv) => {
      const name = (
        conv.other_user?.contract_full_name ||
        conv.other_user?.full_name ||
        conv.other_user?.username ||
        ''
      ).toLowerCase()
      return name.includes(query)
    })
  }, [shareConversationSearch, shareConversations])

  const selectedApplicantsList = useMemo(() => {
    if (!selectedContext || selectedContext.mode !== 'owner') return []
    return acceptedApplications.filter(
      (app) => app.post_id === selectedContext.post.id && selectedApplicants[app.id]
    )
  }, [acceptedApplications, selectedApplicants, selectedContext])

  const canAddCustomArticle = useMemo(() => {
    const last = customArticles[customArticles.length - 1]
    return Boolean(last && last.trim().length > 0)
  }, [customArticles])

  const resolvedPaymentType = selectedPaymentType || selectedContext?.post.payment_type || null
  const resolvedContractType = contractType === 'auto' ? resolvedPaymentType || 'collaboration' : contractType

  const paymentLabels: Record<string, string> = {
    remuneration: 'Rémunération',
    prix: 'Prix',
    'partage-revenus': 'Partage de revenus',
    echange: 'Échange de service',
    'visibilite-contre-service': 'Visibilité contre service',
    'co-creation': 'Co-création',
    participation: 'Participation',
    association: 'Association',
    collaboration: 'Collaboration'
  }
  const buildCurrentContractTitle = () => contractName.trim() || `Contrat ${paymentLabels[resolvedContractType] || 'Collaboration'}`

  const selectedPaymentConfig = useMemo(() => getPaymentOptionConfig(resolvedPaymentType), [resolvedPaymentType])
  const shouldShowRevenueShare =
    resolvedContractType === 'partage-revenus' || resolvedPaymentType === 'partage-revenus'
  const shouldShowPrice = resolvedPaymentType === 'remuneration'
  const shouldShowExchange =
    resolvedContractType === 'echange' ||
    Boolean(selectedPaymentConfig?.requiresExchangeService)
  const shouldShowVisibiliteOfferType = resolvedPaymentType === 'visibilite-contre-service'
  const shouldShowVisibiliteServiceDetails =
    resolvedPaymentType === 'visibilite-contre-service' && visibiliteOfferType === 'service'
  const shouldShowCoCreationDetails = resolvedPaymentType === 'co-creation'

  const applyDraftSnapshot = useCallback((draft: ContractDraftSnapshot | null) => {
    if (!draft) return
    skipNextDraftSave.current = true
    setContractName(draft.contract_name || '')
    setSelectedOption(draft.selected_option || '')
    setContractType(draft.contract_type || 'auto')
    setSelectedPaymentType(draft.selected_payment_type || '')
    setPriceValue(draft.price_value || '')
    setRevenueShare(draft.revenue_share || '')
    setExchangeService(draft.exchange_service || '')
    setVisibiliteOfferType((draft.visibilite_offer_type || '') as '' | 'visibilite' | 'service')
    setVisibiliteServiceDetails(draft.visibilite_service_details || '')
    setCoCreationDetails(draft.co_creation_details || '')
    setCustomClauses(draft.custom_clauses || '')
    setCustomArticles(draft.custom_articles && draft.custom_articles.length > 0 ? draft.custom_articles : [''])
    setAgreementConfirmed(Boolean(draft.agreement_confirmed))
    if (Object.prototype.hasOwnProperty.call(draft, 'default_articles')) {
      const incoming = Array.isArray(draft.default_articles) ? draft.default_articles : []
      setDefaultArticles(incoming)
      setHasDefaultArticlesCustom(true)
    }
    if (draft.selected_applicants) {
      setSelectedApplicants(draft.selected_applicants)
    } else {
      setSelectedApplicants({})
    }
  }, [])

  const legalArticles = useMemo(() => {
    const baseArticles = [
      {
        title: 'Objet du contrat',
        content:
          'Le présent contrat formalise la collaboration liée à l’annonce sélectionnée et définit les engagements des parties.'
      },
      {
        title: 'Livrables et calendrier',
        content:
          'Les livrables et les délais sont définis dans l’annonce et validés entre les parties.'
      },
      {
        title: 'Confidentialité',
        content:
          'Les parties s’engagent à garder confidentielles les informations sensibles partagées durant la collaboration.'
      },
      {
        title: 'Résiliation',
        content:
          'Chaque partie peut demander la résiliation en cas de manquement ou d’impossibilité de poursuivre la mission.'
      },
      {
        title: 'Loi applicable',
        content:
          'Le présent contrat est régi par la loi française. En cas de litige, une solution amiable sera privilégiée.'
      }
    ]

    if (resolvedContractType === 'partage-revenus') {
      baseArticles.splice(1, 0, {
        title: 'Partage de revenus',
        content:
          'Les revenus générés par la collaboration sont répartis selon le pourcentage convenu et précisé dans ce contrat.'
      })
    }
    if (resolvedContractType === 'remuneration' || resolvedContractType === 'prix') {
      baseArticles.splice(1, 0, {
        title: 'Rémunération',
        content:
          'La rémunération est définie dans ce contrat et doit être réglée selon les modalités convenues entre les parties.'
      })
    }
    if (resolvedContractType === 'echange') {
      baseArticles.splice(1, 0, {
        title: 'Échange de service',
        content:
          'Les parties valident la nature de l’échange de service et s’engagent à honorer les conditions acceptées.'
      })
    }

    return baseArticles
  }, [resolvedContractType])

  useEffect(() => {
    if (!hasDefaultArticlesCustom) {
      setDefaultArticles(legalArticles)
    }
  }, [hasDefaultArticlesCustom, legalArticles])

  useEffect(() => {
    const loadDrafts = async () => {
      if (!user || draftLoaded || loading) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('contract_drafts') as any)
          .select('id, draft, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        const rows = ((data || []) as ContractDraftRow[]).map((row) => ({
          id: row.id,
          draft: (row.draft || {}) as ContractDraftSnapshot,
          updated_at: row.updated_at
        }))

        setDrafts(rows)

        // Ne pas charger automatiquement un brouillon au démarrage:
        // l'utilisateur choisit explicitement quel brouillon ouvrir.
      } catch (err) {
        console.error('Error loading contract draft:', err)
      } finally {
        setDraftLoaded(true)
      }
    }

    loadDrafts()
  }, [applyDraftSnapshot, draftLoaded, loading, user])

  useEffect(() => {
    if (!user || !draftLoaded) return
    if (skipNextDraftSave.current) {
      skipNextDraftSave.current = false
      return
    }

    const payload = {
      user_id: user.id,
      draft: {
        contract_name: contractName,
        selected_option: selectedOption,
        contract_type: contractType,
        selected_payment_type: selectedPaymentType,
        price_value: priceValue,
        revenue_share: revenueShare,
        exchange_service: exchangeService,
        visibilite_offer_type: visibiliteOfferType,
        visibilite_service_details: visibiliteServiceDetails,
        co_creation_details: coCreationDetails,
        custom_clauses: customClauses,
        custom_articles: customArticles,
        agreement_confirmed: agreementConfirmed,
        default_articles: defaultArticles,
        selected_applicants: selectedApplicants
      },
      updated_at: new Date().toISOString()
    }

    const timer = window.setTimeout(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (activeDraftId) {
          const { data: updatedRows } = await (supabase.from('contract_drafts') as any)
            .update({ draft: payload.draft, updated_at: payload.updated_at })
            .eq('id', activeDraftId)
            .eq('user_id', user.id)
            .select('id, draft, updated_at')

          const updated = (updatedRows || [])[0] as ContractDraftRow | undefined
          if (updated) {
            setDrafts((prev) => {
              const next = prev.map((row) => (row.id === updated.id ? updated : row))
              return next.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
            })
          }
        }
      } catch (err) {
        console.error('Error saving contract draft:', err)
      }
    }, 800)

    return () => window.clearTimeout(timer)
  }, [
    agreementConfirmed,
    contractName,
    contractType,
    customArticles,
    customClauses,
    defaultArticles,
    draftLoaded,
    exchangeService,
    coCreationDetails,
    priceValue,
    revenueShare,
    selectedApplicants,
    selectedOption,
    selectedPaymentType,
    visibiliteOfferType,
    visibiliteServiceDetails,
    user
  ])

  // loadData useEffect moved below loadContracts

  useEffect(() => {
    if (!isSignatureModalOpen) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const setupCanvas = () => {
      const context = canvas.getContext('2d')
      if (!context) return

      const { width } = canvas.getBoundingClientRect()
      const height = 200
      const devicePixelRatio = window.devicePixelRatio || 1

      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      context.lineWidth = 2
      context.lineCap = 'round'
      context.strokeStyle = '#111111'
      context.clearRect(0, 0, width, height)

      if (contractProfile.signature) {
        const image = new Image()
        image.onload = () => {
          context.clearRect(0, 0, width, height)
          context.drawImage(image, 0, 0, width, height)
          setSignatureHasData(true)
        }
        image.src = contractProfile.signature
      } else {
        setSignatureHasData(false)
      }
    }

    const frame = window.requestAnimationFrame(setupCanvas)
    return () => window.cancelAnimationFrame(frame)
  }, [contractProfile.signature, isSignatureModalOpen])

  useEffect(() => {
    const hasBlockingOverlay =
      isSignatureModalOpen ||
      showPostPicker ||
      shareModalOpen ||
      (showPaymentPicker && Boolean(selectedContext)) ||
      (showVisibiliteOfferTypePicker && shouldShowVisibiliteOfferType)
    if (hasBlockingOverlay) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isSignatureModalOpen, selectedContext, shareModalOpen, showPaymentPicker, showPostPicker, showVisibiliteOfferTypePicker, shouldShowVisibiliteOfferType])

  useEffect(() => {
    setPreferredCounterpartyId(counterpartyParam)
  }, [counterpartyParam])

  const loadContracts = useCallback(async () => {
    if (!user) return
    try {
      const { data, error: contractsError } = await supabase
        .from('contracts')
        .select(
          `
          id,
          post_id,
          application_id,
          creator_id,
          counterparty_id,
          contract_type,
          payment_type,
          price,
          revenue_share_percentage,
          exchange_service,
          contract_content,
          custom_clauses,
          status,
          agreement_confirmed,
          created_at,
          post:posts(title),
          counterparty:profiles!contracts_counterparty_id_fkey(id, username, full_name, avatar_url),
          creator:profiles!contracts_creator_id_fkey(id, username, full_name, avatar_url)
        `
        )
        .or(`creator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (contractsError) {
        console.error('Error loading contracts:', contractsError)
        setContracts([])
        return
      }

      setContracts((data || []) as ContractRecord[])
    } catch (err) {
      console.error('Error loading contracts:', err)
      setContracts([])
    }
  }, [user])

  useEffect(() => {
    if (!user || !sharedContractParam || contracts.length === 0) return
    const targetContract = contracts.find((contract) => contract.id === sharedContractParam)
    if (!targetContract) return

    setActiveTab('list')

    if (handledSharedContractPrompt === sharedContractParam) return

    const isCreator = targetContract.creator_id === user.id
    const isCounterparty = targetContract.counterparty_id === user.id
    if (!isCreator && !isCounterparty) return

    setHandledSharedContractPrompt(sharedContractParam)

    const openField = isCreator ? 'creator_opened_at' : 'counterparty_opened_at'
    const acceptField = isCreator ? 'creator_accepted_at' : 'counterparty_accepted_at'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase.from('contracts') as any)
      .update({ [openField]: new Date().toISOString() })
      .eq('id', targetContract.id)
      .then(() => undefined)
      .catch((error: unknown) => console.error('Error marking shared contract as opened:', error))

    if (shouldAcceptSharedContract) {
      const accepted = window.confirm(
        'Acceptez-vous de remplir ce contrat avec cet utilisateur ? Vous pourrez compléter vos informations et signer de votre côté.'
      )
      if (accepted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(supabase.from('contracts') as any)
          .update({ [openField]: new Date().toISOString(), [acceptField]: new Date().toISOString() })
          .eq('id', targetContract.id)
          .then(async () => {
            await loadContracts()
            showSuccess('Contrat accepté. Vous pouvez maintenant le compléter.')
          })
          .catch((error: unknown) => console.error('Error accepting shared contract:', error))
      }
    }
  }, [
    contracts,
    handledSharedContractPrompt,
    loadContracts,
    sharedContractParam,
    shouldAcceptSharedContract,
    showSuccess,
    user
  ])

  useEffect(() => {
    if (!user || !sharedContractParam || loading) return
    if (hydratedSharedContractId === sharedContractParam) return
    const targetContract = contracts.find((contract) => contract.id === sharedContractParam)
    if (!targetContract) return

    let nextSelectedOption = ''
    const applicantMatch = targetContract.application_id
      ? acceptedAsApplicant.find((app) => app.id === targetContract.application_id)
      : null
    const ownerPostMatch = targetContract.post_id
      ? ownedPosts.find((post) => post.id === targetContract.post_id)
      : null

    if (applicantMatch) {
      nextSelectedOption = `applicant:${applicantMatch.id}`
      setSelectedApplicants({})
    } else if (ownerPostMatch) {
      nextSelectedOption = `owner:${ownerPostMatch.id}`
      if (targetContract.application_id) {
        setSelectedApplicants({ [targetContract.application_id]: true })
      } else {
        setSelectedApplicants({})
      }
    } else {
      // Contrat visible mais contexte source indisponible (annonce/app candidature supprimée).
      // On garde la page liste afin d'éviter un formulaire incohérent.
      return
    }

    skipNextDraftSave.current = true
    setActiveDraftId(null)
    setActiveTab('create')
    setSelectedOption(nextSelectedOption)
    setContractType(targetContract.contract_type || 'auto')
    setSelectedPaymentType(targetContract.payment_type || '')
    setContractName(extractContractNameFromContent(targetContract.contract_content) || '')
    setPriceValue(targetContract.price != null ? String(targetContract.price) : '')
    setRevenueShare(targetContract.revenue_share_percentage != null ? String(targetContract.revenue_share_percentage) : '')
    setExchangeService(targetContract.exchange_service || '')
    setCustomClauses(targetContract.custom_clauses || '')
    setAgreementConfirmed(Boolean(targetContract.agreement_confirmed))
    setHydratedSharedContractId(sharedContractParam)
  }, [
    acceptedAsApplicant,
    contracts,
    hydratedSharedContractId,
    loading,
    ownedPosts,
    sharedContractParam,
    user
  ])

  const findOrCreateDirectConversation = useCallback(
    async (otherUserId: string, postId?: string | null) => {
      if (!user) return null
      try {
        const { data: existing } = await supabase
          .from('public_conversations_with_users' as any)
          .select('*')
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
          )
          .limit(5)

        const existingDirect = (existing as Array<{ id: string; is_group?: boolean; deleted_at?: string | null }> | null)?.find(
          (row) => !row.is_group && !row.deleted_at
        )
        if (existingDirect?.id) return existingDirect

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created } = await (supabase.from('conversations') as any)
          .insert({
            user1_id: user.id,
            user2_id: otherUserId,
            post_id: postId || null,
            type: 'direct',
            is_group: false
          })
          .select()
          .single()

        return created as { id: string } | null
      } catch (error) {
        console.error('Error creating contract conversation:', error)
        return null
      }
    },
    [user]
  )

  const sendContractShareMessage = useCallback(
    async ({
      contractId,
      counterpartyId,
      postId,
      contractLabel,
      contractContent,
      contractStatus
    }: {
      contractId: string
      counterpartyId: string
      postId?: string | null
      contractLabel?: string | null
      contractContent?: string | null
      contractStatus?: string | null
    }) => {
      if (!user) return
      const conversation = await findOrCreateDirectConversation(counterpartyId, postId || null)
      if (!conversation || !(conversation as { id?: string }).id) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('messages') as any).insert({
        conversation_id: (conversation as { id: string }).id,
        sender_id: user.id,
        message_type: 'contract_share',
        content: (contractLabel || '').trim() ? `Contrat partagé • ${contractLabel}` : 'Contrat partagé',
        shared_contract_id: contractId,
        calendar_request_data: {
          kind: 'contract_share_snapshot',
          contract_title: (contractLabel || '').trim() || null,
          contract_content: contractContent || null,
          status: contractStatus || null
        }
      })

      if (error) {
        console.error('Error sending contract share message:', error)
      }
    },
    [findOrCreateDirectConversation, user]
  )

  const sendContractShareMessageToConversation = useCallback(
    async ({
      contractId,
      conversationId,
      contractLabel,
      contractContent,
      contractStatus
    }: {
      contractId: string
      conversationId: string
      contractLabel?: string | null
      contractContent?: string | null
      contractStatus?: string | null
    }) => {
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('messages') as any).insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: 'contract_share',
        content: (contractLabel || '').trim() ? `Contrat partagé • ${contractLabel}` : 'Contrat partagé',
        shared_contract_id: contractId,
        calendar_request_data: {
          kind: 'contract_share_snapshot',
          contract_title: (contractLabel || '').trim() || null,
          contract_content: contractContent || null,
          status: contractStatus || null
        }
      })
      if (error) {
        throw error
      }
    },
    [user]
  )

  const loadShareConversations = useCallback(async () => {
    if (!user) return
    setShareConversationsLoading(true)
    try {
      const { data, error } = await supabase
        .from('public_conversations_with_users' as any)
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const rows = (data as Array<Record<string, unknown>> | null) || []
      const directRows = rows.filter((row) => !(row as { is_group?: boolean }).is_group)
      const otherIds = Array.from(
        new Set(
          directRows
            .map((row) => {
              const user1 = String((row as { user1_id?: string | null }).user1_id || '')
              const user2 = String((row as { user2_id?: string | null }).user2_id || '')
              return user1 === user.id ? user2 : user1
            })
            .filter(Boolean)
        )
      )

      let profilesMap = new Map<string, ProfileSummary>()
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select(
            'id, username, full_name, avatar_url, email, phone, contract_full_name, contract_email, contract_phone, contract_city, contract_country, contract_siren, contract_signature, contract_default_type'
          )
          .in('id', otherIds)
        profilesMap = new Map(((profiles || []) as ProfileSummary[]).map((profile) => [profile.id, profile]))
      }

      const mappedRaw: ContractShareConversation[] = directRows
        .map((row) => {
          const user1 = String((row as { user1_id?: string | null }).user1_id || '')
          const user2 = String((row as { user2_id?: string | null }).user2_id || '')
          const otherUserId = user1 === user.id ? user2 : user1
          return {
            id: String((row as { id?: string }).id || ''),
            user1_id: user1,
            user2_id: user2,
            last_message_at: ((row as { last_message_at?: string | null }).last_message_at || null) as string | null,
            other_user: profilesMap.get(otherUserId) || null
          }
        })
        .filter((row) => Boolean(row.id && row.other_user?.id))
        .filter((row) => {
          const other = row.other_user
          if (!other) return false
          const normalizedSystemEmail = SYSTEM_SENDER_EMAIL.toLowerCase()
          const emailValues = [other.email, other.contract_email]
            .filter(Boolean)
            .map((value) => String(value).trim().toLowerCase())
          if (emailValues.includes(normalizedSystemEmail)) return false

          const identifiers = [
            other.username,
            other.full_name,
            other.contract_full_name,
            ...emailValues
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase())

          // Ne jamais proposer le profil système / équipe Ollync dans l'envoi de contrat.
          return !identifiers.some((value) => value.includes('ollync'))
        })

      const dedupedByProfile = new Map<string, ContractShareConversation>()
      for (const row of mappedRaw) {
        const profileId = row.other_user?.id
        if (!profileId) continue
        const existing = dedupedByProfile.get(profileId)
        if (!existing) {
          dedupedByProfile.set(profileId, row)
          continue
        }

        const existingTs = existing.last_message_at ? +new Date(existing.last_message_at) : 0
        const nextTs = row.last_message_at ? +new Date(row.last_message_at) : 0
        if (nextTs > existingTs) {
          dedupedByProfile.set(profileId, row)
        }
      }

      const mapped = Array.from(dedupedByProfile.values()).sort((a, b) => {
        const aTs = a.last_message_at ? +new Date(a.last_message_at) : 0
        const bTs = b.last_message_at ? +new Date(b.last_message_at) : 0
        return bTs - aTs
      })

      setShareConversations(mapped)
      setSelectedShareConversationId(mapped[0]?.id || null)
    } catch (err) {
      console.error('Error loading conversations for contract share:', err)
      setShareConversations([])
      setSelectedShareConversationId(null)
    } finally {
      setShareConversationsLoading(false)
    }
  }, [user])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        if (user) {
          const { data: profileDataRaw } = await supabase
            .from('profiles')
            .select(
              'id, username, full_name, avatar_url, email, phone, contract_full_name, contract_email, contract_phone, contract_city, contract_country, contract_siren, contract_signature, contract_default_type'
            )
            .eq('id', user.id)
            .single()

          const profileData = profileDataRaw as ProfileSummary | null
          if (profileData) {
            setCurrentUserProfile(profileData)
            const derivedFullName =
              profileData.contract_full_name ||
              profileData.full_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              ''
            const derivedEmail = profileData.contract_email || profileData.email || user.email || ''
            const derivedPhone = profileData.contract_phone || profileData.phone || ''
            setContractProfile({
              fullName: derivedFullName,
              email: derivedEmail,
              phone: derivedPhone,
              city: profileData.contract_city || '',
              country: profileData.contract_country || '',
              siren: profileData.contract_siren || '',
              signature: profileData.contract_signature || ''
            })
          }

          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('id, title, description, status, payment_type, price, number_of_people, user_id, created_at')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })

          if (postsError) {
            setError('Impossible de charger vos annonces.')
          }

          const ownedPostsData = (postsData || []) as PostSummary[]
          setOwnedPosts(ownedPostsData)

          if (ownedPostsData.length > 0) {
            const postIds = ownedPostsData.map((post) => post.id)
            const { data: applicationsData } = await supabase
              .from('applications')
              .select(
                `
                id,
                post_id,
                applicant_id,
                status,
                created_at,
                applicant:profiles!applications_applicant_id_fkey(id, username, full_name, avatar_url, email, phone, contract_full_name, contract_email, contract_phone, contract_city, contract_country, contract_siren, contract_signature, contract_default_type)
              `
              )
              .eq('status', 'accepted')
              .in('post_id', postIds)

            setAcceptedApplications((applicationsData || []) as ApplicationSummary[])
          } else {
            setAcceptedApplications([])
          }

          const { data: applicantApplications } = await supabase
            .from('applications')
            .select('id, post_id, applicant_id, status, created_at')
            .eq('applicant_id', user.id)
            .eq('status', 'accepted')

          const acceptedApplicationsData = (applicantApplications || []) as ApplicationSummary[]
          setAcceptedAsApplicant(acceptedApplicationsData)

          if (acceptedApplicationsData.length > 0) {
            const applicantPostIds = acceptedApplicationsData.map((app) => app.post_id)
            const { data: postsForApplicant } = await supabase
              .from('posts')
              .select('id, title, description, status, payment_type, price, number_of_people, user_id, created_at')
              .in('id', applicantPostIds)

            const postsMap: Record<string, PostSummary> = {}
            ;(postsForApplicant || []).forEach((post) => {
              postsMap[(post as PostSummary).id] = post as PostSummary
            })
            setApplicantPostMap(postsMap)

            const ownerIds = Array.from(
              new Set((postsForApplicant || []).map((post) => (post as PostSummary).user_id))
            )
            if (ownerIds.length > 0) {
              const { data: ownersData } = await supabase
                .from('profiles')
                .select(
                  'id, username, full_name, avatar_url, email, phone, contract_full_name, contract_email, contract_phone, contract_city, contract_country, contract_siren, contract_signature, contract_default_type'
                )
                .in('id', ownerIds)

              const ownerMap: Record<string, ProfileSummary> = {}
              ;(ownersData || []).forEach((profile) => {
                ownerMap[(profile as ProfileSummary).id] = profile as ProfileSummary
              })
              setOwnerProfileMap(ownerMap)
            }
          } else {
            setApplicantPostMap({})
            setOwnerProfileMap({})
          }
        } else {
          setApplicantPostMap({})
          setOwnerProfileMap({})
        }

        await loadContracts()
      } catch (err) {
        console.error('Error loading contracts data:', err)
        setError('Une erreur est survenue lors du chargement des contrats.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, loadContracts])

  useEffect(() => {
    setSelectedApplicants({})
  }, [selectedOption])

  useEffect(() => {
    if (!shouldShowPrice) setPriceValue('')
    if (!shouldShowRevenueShare) setRevenueShare('')
    if (!shouldShowExchange) setExchangeService('')
    if (!shouldShowVisibiliteOfferType) {
      setVisibiliteOfferType('')
      setVisibiliteServiceDetails('')
    }
    if (!shouldShowVisibiliteServiceDetails) setVisibiliteServiceDetails('')
    if (!shouldShowCoCreationDetails) setCoCreationDetails('')
  }, [
    shouldShowCoCreationDetails,
    shouldShowExchange,
    shouldShowPrice,
    shouldShowRevenueShare,
    shouldShowVisibiliteOfferType,
    shouldShowVisibiliteServiceDetails
  ])

  useEffect(() => {
    if (contractProfileSaved) {
      setContractProfileSaved(false)
    }
  }, [contractProfile, contractProfileSaved])

  useEffect(() => {
    if (!currentUserProfile?.contract_default_type) return
    if (contractType !== 'auto') return
    setContractType(currentUserProfile.contract_default_type)
  }, [contractType, currentUserProfile?.contract_default_type])

  useEffect(() => {
    if (!selectedContext) {
      setSelectedApplicants({})
      setSelectedPaymentType('')
      return
    }
    if (selectedContext.mode === 'owner') {
      const nextSelection: Record<string, boolean> = {}
      const matchingApplications = acceptedApplications.filter((app) => app.post_id === selectedContext.post.id)
      const preferredMatches = preferredCounterpartyId
        ? matchingApplications.filter((app) => app.applicant_id === preferredCounterpartyId)
        : []

      const selectionSource = preferredMatches.length > 0 ? preferredMatches : matchingApplications
      selectionSource.forEach((app) => {
        nextSelection[app.id] = true
      })
      setSelectedApplicants(nextSelection)
    } else {
      setSelectedApplicants({})
    }
    if (selectedContext.post.price && (!priceValue || Number(priceValue) <= 0)) {
      setPriceValue(String(selectedContext.post.price))
    }
    if (!selectedPaymentType && selectedContext.post.payment_type) {
      setSelectedPaymentType(selectedContext.post.payment_type)
    }
    if (
      selectedContext.post.revenue_share_percentage &&
      (!revenueShare || Number(revenueShare) <= 0)
    ) {
      setRevenueShare(String(selectedContext.post.revenue_share_percentage))
    }
    if (!coCreationDetails && selectedContext.post.co_creation_details) {
      setCoCreationDetails(selectedContext.post.co_creation_details)
    }
    if (!visibiliteOfferType && selectedContext.post.visibilite_offer_type) {
      setVisibiliteOfferType(selectedContext.post.visibilite_offer_type)
    }
    if (!visibiliteServiceDetails && selectedContext.post.visibilite_service_details) {
      setVisibiliteServiceDetails(selectedContext.post.visibilite_service_details)
    }
  }, [
    acceptedApplications,
    coCreationDetails,
    preferredCounterpartyId,
    priceValue,
    revenueShare,
    selectedContext,
    selectedPaymentType,
    visibiliteOfferType,
    visibiliteServiceDetails
  ])

  useEffect(() => {
    setShowPaymentPicker(!(resolvedPaymentType && resolvedPaymentType.trim().length > 0))
  }, [resolvedPaymentType])

  useEffect(() => {
    if (!counterpartyParam || selectedOption) return

    const ownerMatch = acceptedApplications.find((app) => app.applicant_id === counterpartyParam)
    if (ownerMatch) {
      setActiveTab('create')
      setSelectedOption(`owner:${ownerMatch.post_id}`)
      return
    }

    const applicantMatch = acceptedAsApplicant.find((app) => {
      const post = applicantPostMap[app.post_id]
      return post?.user_id === counterpartyParam
    })

    if (applicantMatch) {
      setActiveTab('create')
      setSelectedOption(`applicant:${applicantMatch.id}`)
    }
  }, [acceptedApplications, acceptedAsApplicant, applicantPostMap, counterpartyParam, selectedOption])

  const formatUserName = (profile?: ProfileSummary | null) => {
    if (!profile) return 'Utilisateur'
    return profile.contract_full_name || profile.full_name || profile.username || 'Utilisateur'
  }

  const formatDate = (value?: string | null) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('fr-FR')
  }

  const resolveContractValue = (value?: string | null) => value?.trim() || ''

  const resolveContractName = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_full_name || profile?.full_name || profile?.username || 'Utilisateur')

  const resolveContractEmail = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_email || profile?.email || '')

  const resolveContractPhone = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_phone || profile?.phone || '')

  const resolveContractCity = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_city || '')

  const resolveContractCountry = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_country || '')

  const resolveContractSiren = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_siren || '')

  const resolveContractSignature = (profile?: ProfileSummary | null) =>
    resolveContractValue(profile?.contract_signature || '')

  const resolveCreatorProfile = useCallback((): ProfileSummary | null => {
    if (!user) return null
    const baseProfile: ProfileSummary = currentUserProfile || {
      id: user.id,
      username: user.user_metadata?.username || null,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      email: user.email || null,
      phone: null,
      contract_full_name: null,
      contract_email: null,
      contract_phone: null,
      contract_city: null,
      contract_country: null,
      contract_siren: null,
      contract_signature: null,
      contract_default_type: null
    }

    return {
      ...baseProfile,
      contract_full_name:
        resolveContractValue(contractProfile.fullName) || baseProfile.contract_full_name || baseProfile.full_name,
      contract_email:
        resolveContractValue(contractProfile.email) || baseProfile.contract_email || baseProfile.email,
      contract_phone:
        resolveContractValue(contractProfile.phone) || baseProfile.contract_phone || baseProfile.phone,
      contract_city: resolveContractValue(contractProfile.city) || baseProfile.contract_city,
      contract_country: resolveContractValue(contractProfile.country) || baseProfile.contract_country,
      contract_siren: resolveContractValue(contractProfile.siren) || baseProfile.contract_siren,
      contract_signature: resolveContractValue(contractProfile.signature) || baseProfile.contract_signature
    }
  }, [contractProfile, currentUserProfile, resolveContractValue, user])

  const getSignaturePoint = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()

    if ('touches' in event) {
      const touch = event.touches[0]
      if (!touch) return null
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startSignature = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const point = getSignaturePoint(event)
    const canvas = signatureCanvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !point) return

    context.beginPath()
    context.moveTo(point.x, point.y)
    signaturePointRef.current = point
    setIsDrawingSignature(true)
    setSignatureHasData(true)
  }

  const drawSignature = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return
    event.preventDefault()
    const point = getSignaturePoint(event)
    const canvas = signatureCanvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !point) return

    context.lineTo(point.x, point.y)
    context.stroke()
    signaturePointRef.current = point
  }

  const endSignature = () => {
    if (!isDrawingSignature) return
    setIsDrawingSignature(false)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const { width, height } = canvas.getBoundingClientRect()
    context.clearRect(0, 0, width, height)
    setSignatureHasData(false)
  }

  const handleSaveSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const dataUrl = signatureHasData ? canvas.toDataURL('image/png') : ''
    setContractProfile((prev) => ({ ...prev, signature: dataUrl }))
    setIsSignatureModalOpen(false)
    showSuccess('Signature enregistrée.')
  }

  const buildPartyBlock = (profile: ProfileSummary, roleLabel: string) => {
    const lines = [`- ${resolveContractName(profile)} (${roleLabel})`]
    const email = resolveContractEmail(profile)
    const phone = resolveContractPhone(profile)
    const city = resolveContractCity(profile)
    const country = resolveContractCountry(profile)
    const siren = resolveContractSiren(profile)

    if (email) lines.push(`Email : ${email}`)
    if (phone) lines.push(`Téléphone : ${phone}`)
    if (city || country) lines.push(`Ville/Pays : ${[city, country].filter(Boolean).join(', ')}`)
    if (siren) lines.push(`SIREN : ${siren}`)

    return lines.join('\n')
  }

  const getRemunerationText = () => {
    const remunerationDetails: string[] = []
    if (resolvedPaymentType) {
      remunerationDetails.push(`Moyen de paiement retenu : ${paymentLabels[resolvedPaymentType] || resolvedPaymentType}`)
    }
    if (shouldShowPrice && priceValue) {
      remunerationDetails.push(`Montant convenu : ${priceValue} €`)
    }
    if (shouldShowRevenueShare && revenueShare) {
      remunerationDetails.push(`Partage de revenus : ${revenueShare}%`)
    }
    if (shouldShowExchange && exchangeService.trim()) {
      remunerationDetails.push(`Échange de service : ${exchangeService.trim()}`)
    }
    if (shouldShowVisibiliteOfferType && visibiliteOfferType) {
      remunerationDetails.push(
        `Visibilité contre service - offre retenue : ${visibiliteOfferType === 'visibilite' ? 'Visibilité' : 'Service'}`
      )
    }
    if (shouldShowVisibiliteServiceDetails && visibiliteServiceDetails.trim()) {
      remunerationDetails.push(`Détail du service offert : ${visibiliteServiceDetails.trim()}`)
    }
    if (shouldShowCoCreationDetails && coCreationDetails.trim()) {
      remunerationDetails.push(`Détails de co-création : ${coCreationDetails.trim()}`)
    }

    return remunerationDetails.length > 0
      ? remunerationDetails.join(' - ')
      : 'Les modalités financières seront précisées entre les parties.'
  }

  const getCombinedArticles = () => {
    const cleanedArticles = customArticles.map((item) => item.trim()).filter(Boolean)
    const articleSource = defaultArticles
    return [
      ...articleSource.map((article) => ({ title: article.title, content: article.content })),
      ...cleanedArticles.map((content) => ({ title: 'Article additionnel', content }))
    ]
  }

  const buildContractContent = ({
    creator,
    counterparty,
    post,
    paymentType,
    contractKind
  }: {
    creator: ProfileSummary
    counterparty: ProfileSummary
    post: PostSummary
    paymentType: string | null
    contractKind: string
  }) => {
    const title = contractName.trim() || `Contrat ${paymentLabels[contractKind] || 'Collaboration'}`
    const paymentLine = paymentType ? paymentLabels[paymentType] || paymentType : 'Non précisé'
    const today = formatDate(new Date().toISOString())
    const signatureDateLine = agreementConfirmed ? `Date de signature : ${today}` : null

    const remunerationText = getRemunerationText()

    const customClauseText = customClauses.trim()
      ? `\nClauses additionnelles :\n${customClauses.trim()}`
      : ''

    const combinedArticles = getCombinedArticles()

    const articleText =
      combinedArticles.length > 0
        ? combinedArticles
            .map((article, index) => `Article ${index + 1} : ${article.title}\n${article.content}`)
            .join('\n\n')
        : 'Aucun article défini.'

    const creatorSignature = resolveContractSignature(creator)
    const counterpartySignature = resolveContractSignature(counterparty)

    return [
      `Nom du contrat : ${title}`,
      `Date d'envoi : ${today}`,
      signatureDateLine,
      '',
      `Parties :`,
      buildPartyBlock(creator, 'Créateur du contrat'),
      buildPartyBlock(counterparty, 'Autre partie'),
      '',
      `Annonce : ${post.title}`,
      `Type de paiement : ${paymentLine}`,
      `Résumé de la collaboration : ${post.description || 'Description non précisée.'}`,
      '',
      `Conditions financières :`,
      remunerationText,
      '',
      `${articleText}`,
      customClauseText,
      '',
      `Signatures :`,
      `Créateur : ${creatorSignature ? 'Signature enregistrée' : 'À compléter'}`,
      `Autre partie : ${counterpartySignature ? 'Signature enregistrée' : 'À compléter'}`,
      '',
      `Accord mutuel : ${agreementConfirmed ? 'Confirmé par les parties' : 'En attente de confirmation'}`
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n\n')
  }

  const buildContractPdfData = ({
    creator,
    counterparty,
    post,
    paymentType,
    contractKind
  }: {
    creator: ProfileSummary
    counterparty: ProfileSummary
    post: PostSummary
    paymentType: string | null
    contractKind: string
  }) => {
    const title = contractName.trim() || `Contrat ${paymentLabels[contractKind] || 'Collaboration'}`
    const paymentLine = paymentType ? paymentLabels[paymentType] || paymentType : 'Non précisé'
    const today = formatDate(new Date().toISOString())
    const signatureDateLine = agreementConfirmed ? `Date de signature : ${today}` : `Date d'envoi : ${today}`

    const remunerationText = getRemunerationText()
    const combinedArticles = getCombinedArticles()
    const clausesText = customClauses.trim() || ''

    const objectText = `Le présent contrat formalise la collaboration liée à l’annonce "${post.title}" et définit les engagements des parties.`

    const parties = [
      ...buildPartyBlock(creator, 'Créateur du contrat').split('\n'),
      '',
      ...buildPartyBlock(counterparty, 'Autre partie').split('\n')
    ]

    const signatures = [
      `Créateur : ${resolveContractSignature(creator) ? 'Signature enregistrée' : 'À compléter'}`,
      `Autre partie : ${resolveContractSignature(counterparty) ? 'Signature enregistrée' : 'À compléter'}`
    ]

    return {
      title,
      dateLine: signatureDateLine,
      object: objectText,
      parties,
      postTitle: post.title,
      paymentLine,
      summary: post.description || 'Description non précisée.',
      remuneration: remunerationText,
      articles: combinedArticles,
      clauses: clausesText,
      signatures,
      agreement: agreementConfirmed ? 'Confirmé par les parties' : 'En attente de confirmation'
    }
  }

  const previewCounterparty = useMemo<ProfileSummary>(() => {
    if (!selectedContext) {
      return {
        id: 'preview-counterparty',
        full_name: 'Autre partie (non renseignée)',
        username: null,
        avatar_url: null,
        email: null,
        phone: null,
        contract_full_name: null,
        contract_email: null,
        contract_phone: null,
        contract_city: null,
        contract_country: null,
        contract_siren: null,
        contract_signature: null,
        contract_default_type: null
      }
    }
    if (selectedContext.mode === 'owner') {
      const selected = selectedApplicantsList[0]?.applicant
      if (selected) return selected
      const fallback = acceptedApplications.find(
        (app) => app.post_id === selectedContext.post.id && app.applicant
      )
      return (
        fallback?.applicant || {
          id: 'preview-counterparty',
          full_name: 'Participant non sélectionné',
          username: null,
          avatar_url: null,
          email: null,
          phone: null,
          contract_full_name: null,
          contract_email: null,
          contract_phone: null,
          contract_city: null,
          contract_country: null,
          contract_siren: null,
          contract_signature: null,
          contract_default_type: null
        }
      )
    }
    return selectedContext.owner
  }, [acceptedApplications, selectedApplicantsList, selectedContext])

  const previewContractContent = useMemo(() => {
    const creatorProfile = resolveCreatorProfile()
    if (!creatorProfile) return ''
    const previewPost: PostSummary =
      selectedContext?.post || {
        id: 'preview-post',
        title: 'Annonce non sélectionnée',
        description: 'Description non précisée.',
        payment_type: null,
        price: null,
        number_of_people: null,
        user_id: creatorProfile.id,
        created_at: undefined
      }
    return buildContractContent({
      creator: creatorProfile,
      counterparty: previewCounterparty,
      post: previewPost,
      paymentType: resolvedPaymentType,
      contractKind: resolvedContractType
    })
  }, [
    buildContractContent,
    previewCounterparty,
    resolvedContractType,
    resolvedPaymentType,
    resolveCreatorProfile,
    selectedContext
  ])

  const previewCounterpartyLabel = useMemo(() => {
    return `Aperçu pour : ${formatUserName(previewCounterparty)}`
  }, [formatUserName, previewCounterparty])

  const buildContractFileName = (postTitle: string, counterparty?: ProfileSummary | null) => {
    const baseTitle = contractName.trim() || postTitle
    const safeTitle = baseTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    if (!counterparty) return `contrat_${safeTitle}.pdf`
    const safeName = formatUserName(counterparty).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    return `contrat_${safeTitle}_${safeName}.pdf`
  }

  const downloadContractPdf = (
    content: string,
    fileName: string,
    data?: {
      title: string
      object: string
      parties: string[]
      postTitle: string
      paymentLine: string
      summary: string
      remuneration: string
      articles: { title: string; content: string }[]
      clauses?: string
      signatures: string[]
      agreement: string
      dateLine: string
    }
  ) => {
    const doc = new jsPDF({ format: 'a4', unit: 'pt' })
    const margin = 48
    const pageHeight = doc.internal.pageSize.height
    const maxWidth = doc.internal.pageSize.width - margin * 2
    let y = margin

    const moveY = (amount: number) => {
      y += amount
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }

    const addLines = (lines: string[], fontSize: number, fontStyle: 'normal' | 'bold', lineHeight: number) => {
      doc.setFont('helvetica', fontStyle)
      doc.setFontSize(fontSize)
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += lineHeight
      })
    }

    const addParagraph = (text: string, fontSize = 11, fontStyle: 'normal' | 'bold' = 'normal') => {
      if (!text) return
      const lines = doc.splitTextToSize(text, maxWidth)
      addLines(lines, fontSize, fontStyle, fontSize + 4)
    }

    const addSectionTitle = (text: string) => {
      moveY(6)
      addParagraph(text, 13, 'bold')
      moveY(2)
    }

    if (data) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      const titleLines = doc.splitTextToSize(data.title, maxWidth) as string[]
      titleLines.forEach((line: string) => {
        const textWidth = doc.getTextWidth(line)
        const x = Math.max(margin, (doc.internal.pageSize.width - textWidth) / 2)
        if (y > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, x, y)
        y += 22
      })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const dateWidth = doc.getTextWidth(data.dateLine)
      doc.text(data.dateLine, doc.internal.pageSize.width - margin - dateWidth, y)
      moveY(18)

      addSectionTitle('Objet du contrat')
      addParagraph(data.object)

      addSectionTitle('Parties')
      addLines(data.parties, 11, 'normal', 16)

      addSectionTitle('Annonce')
      addParagraph(`Titre : ${data.postTitle}`)
      addParagraph(`Type de paiement : ${data.paymentLine}`)
      addParagraph(`Résumé : ${data.summary}`)

      addSectionTitle('Conditions financières')
      addParagraph(data.remuneration)

      addSectionTitle('Articles')
      data.articles.forEach((article, index) => {
        addParagraph(`Article ${index + 1} — ${article.title}`, 12, 'bold')
        addParagraph(article.content, 11, 'normal')
        moveY(4)
      })

      if (data.clauses) {
        addSectionTitle('Clauses additionnelles')
        addParagraph(data.clauses)
      }

      addSectionTitle('Signatures')
      addLines(data.signatures, 11, 'normal', 16)

      addSectionTitle('Accord mutuel')
      addParagraph(data.agreement)
    } else {
      const lines = doc.splitTextToSize(content, maxWidth)
      addLines(lines, 11, 'normal', 16)
    }

    doc.save(fileName)
  }

  const handleResetForm = () => {
    setSelectedApplicants({})
    setSelectedOption('')
    setContractType('auto')
    setSelectedPaymentType('')
    setContractName('')
    setPriceValue('')
    setRevenueShare('')
    setExchangeService('')
    setVisibiliteOfferType('')
    setVisibiliteServiceDetails('')
    setCoCreationDetails('')
    setCustomArticles([''])
    setCustomClauses('')
    setAgreementConfirmed(false)
    setHasDefaultArticlesCustom(false)
    setDefaultArticles(legalArticles)
    showSuccess('Formulaire réinitialisé.')
  }

  const buildCurrentDraftSnapshot = (): ContractDraftSnapshot => ({
    contract_name: contractName,
    selected_option: selectedOption,
    contract_type: contractType,
    selected_payment_type: selectedPaymentType,
    price_value: priceValue,
    revenue_share: revenueShare,
    exchange_service: exchangeService,
    visibilite_offer_type: visibiliteOfferType,
    visibilite_service_details: visibiliteServiceDetails,
    co_creation_details: coCreationDetails,
    custom_clauses: customClauses,
    custom_articles: customArticles,
    agreement_confirmed: agreementConfirmed,
    default_articles: defaultArticles,
    selected_applicants: selectedApplicants
  })

  const saveDraftImmediately = async (): Promise<string | null> => {
    if (!user) return null
    const draftSnapshot = buildCurrentDraftSnapshot()
    const updatedAt = new Date().toISOString()

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (activeDraftId) {
        const { data } = await (supabase.from('contract_drafts') as any)
          .update({ draft: draftSnapshot, updated_at: updatedAt })
          .eq('id', activeDraftId)
          .eq('user_id', user.id)
          .select('id, draft, updated_at')

        const updated = (data || [])[0] as ContractDraftRow | undefined
        if (updated) {
          setDrafts((prev) =>
            prev
              .map((row) => (row.id === updated.id ? updated : row))
              .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
          )
          return updated.id
        }
        return activeDraftId
      }

      const payload = {
        user_id: user.id,
        draft: draftSnapshot,
        updated_at: updatedAt
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('contract_drafts') as any)
        .insert(payload)
        .select('id, draft, updated_at')

      const created = (data || [])[0] as ContractDraftRow | undefined
      if (created) {
        setActiveDraftId(created.id)
        setDrafts((prev) =>
          [created, ...prev.filter((row) => row.id !== created.id)].sort(
            (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)
          )
        )
        return created.id
      }
    } catch (error) {
      console.error('Error saving draft immediately:', error)
    }

    return null
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!user) return
    confirmation.confirm(
      {
        title: 'Supprimer le brouillon',
        message: 'Est-ce que vous voulez vraiment supprimer ce brouillon ?',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        isDestructive: true
      },
      () => {
        void (async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from('contract_drafts') as any)
              .delete()
              .eq('id', draftId)
              .eq('user_id', user.id)

            if (error) throw error

            setDrafts((prev) => {
              const nextDrafts = prev.filter((row) => row.id !== draftId)

              if (activeDraftId === draftId) {
                if (nextDrafts[0]) {
                  setActiveDraftId(nextDrafts[0].id)
                  applyDraftSnapshot(nextDrafts[0].draft || {})
                } else {
                  setActiveDraftId(null)
                  handleResetForm()
                }
              }

              return nextDrafts
            })

            showSuccess('Brouillon supprimé.')
          } catch (error) {
            console.error('Error deleting draft:', error)
            setError('Impossible de supprimer ce brouillon.')
          }
        })()
      }
    )
  }

  const handleResetWithDraftPrompt = () => {
    const hasContent =
      Boolean(contractName.trim()) ||
      Boolean(selectedOption) ||
      Boolean(priceValue) ||
      Boolean(revenueShare) ||
      Boolean(exchangeService.trim()) ||
      Boolean(customClauses.trim()) ||
      customArticles.some((item) => item.trim().length > 0)

    const discardReset = async () => {
      if (activeDraftId && user) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('contract_drafts') as any)
            .delete()
            .eq('id', activeDraftId)
            .eq('user_id', user.id)
          setDrafts((prev) => prev.filter((row) => row.id !== activeDraftId))
        } catch (error) {
          console.error('Error discarding active draft:', error)
        }
      }

      setActiveDraftId(null)
      handleResetForm()
    }

    confirmation.confirm(
      {
        title: 'Réinitialiser le contrat',
        message: 'Choisissez comment vous voulez réinitialiser ce contrat.',
        confirmLabel: 'Réinitialiser + brouillon',
        cancelLabel: 'Oui réinitialiser',
        isDestructive: false
      },
      () => {
        void (async () => {
          if (hasContent) {
            await saveDraftImmediately()
          }
          setActiveDraftId(null)
          handleResetForm()
        })()
      },
      () => {
        void discardReset()
      }
    )
  }

  const handleLoadDraft = (draftRow: ContractDraftRow) => {
    setActiveTab('create')
    setActiveDraftId(draftRow.id)
    applyDraftSnapshot(draftRow.draft || {})
    showSuccess('Brouillon chargé.')
  }

  useEffect(() => {
    if (!draftParam || handledDraftParam === draftParam || drafts.length === 0) return
    const targetDraft = drafts.find((draft) => draft.id === draftParam)
    if (!targetDraft) return
    setHandledDraftParam(draftParam)
    handleLoadDraft(targetDraft)
  }, [draftParam, drafts, handledDraftParam])

  useEffect(() => {
    if (!draftNameParam || handledDraftNameParam === draftNameParam || drafts.length === 0) return
    const normalizedTarget = draftNameParam.trim().toLowerCase()
    if (!normalizedTarget) return
    const targetDraft = drafts.find((draft) => getDraftDisplayName(draft.draft).trim().toLowerCase() === normalizedTarget)
    if (!targetDraft) return
    setHandledDraftNameParam(draftNameParam)
    handleLoadDraft(targetDraft)
  }, [draftNameParam, drafts, handledDraftNameParam])

  useEffect(() => {
    if (!sharedContractParam || loading || !draftLoaded) return
    if (handledMissingLinkedContract === sharedContractParam) return
    if (contracts.some((contract) => contract.id === sharedContractParam)) return

    const normalizedDraftName = (draftNameParam || '').trim().toLowerCase()
    const hasMatchingDraft = normalizedDraftName
      ? drafts.some((draft) => getDraftDisplayName(draft.draft).trim().toLowerCase() === normalizedDraftName)
      : false

    if (!hasMatchingDraft) {
      setHandledMissingLinkedContract(sharedContractParam)
      setError('Contrat supprimé.')
    }
  }, [contracts, draftLoaded, draftNameParam, drafts, handledMissingLinkedContract, loading, sharedContractParam])

  const handleSaveContractProfile = async () => {
    if (!user) return
    setContractProfileSaving(true)
    setContractProfileSaved(false)
    setError(null)

    const payload: ProfileUpdate = {
      contract_full_name: resolveContractValue(contractProfile.fullName) || null,
      contract_email: resolveContractValue(contractProfile.email) || null,
      contract_phone: resolveContractValue(contractProfile.phone) || null,
      contract_city: resolveContractValue(contractProfile.city) || null,
      contract_country: resolveContractValue(contractProfile.country) || null,
      contract_siren: resolveContractValue(contractProfile.siren) || null,
      contract_signature: resolveContractValue(contractProfile.signature) || null
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any).update(payload).eq('id', user.id)
      if (updateError) throw updateError
      setCurrentUserProfile((prev) => (prev ? { ...prev, ...payload } : prev))
      setContractProfileSaved(true)
      showSuccess('Informations contractuelles enregistrées.')
    } catch (err) {
      console.error('Error saving contract profile:', err)
      setError("Impossible d'enregistrer vos informations contractuelles.")
    } finally {
      setContractProfileSaving(false)
    }
  }

  const createContractForCounterparty = async ({
    creatorWithContractDetails,
    counterparty,
    post,
    applicationId
  }: {
    creatorWithContractDetails: ProfileSummary
    counterparty: ProfileSummary
    post: PostSummary
    applicationId?: string | null
  }) => {
    const contractContent = buildContractContent({
      creator: creatorWithContractDetails,
      counterparty,
      post,
      paymentType: resolvedPaymentType,
      contractKind: resolvedContractType
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: createdContracts, error: insertError } = await (supabase.from('contracts') as any)
      .insert({
        post_id: post.id,
        application_id: applicationId || null,
        creator_id: user?.id,
        counterparty_id: counterparty.id,
        contract_type: resolvedContractType,
        payment_type: resolvedPaymentType,
        price: priceValue ? Number(priceValue) : null,
        revenue_share_percentage: revenueShare ? Number(revenueShare) : null,
        exchange_service: exchangeService.trim() || null,
        contract_content: contractContent,
        custom_clauses: customClauses.trim() || null,
        status: agreementConfirmed ? 'confirmed' : 'generated',
        agreement_confirmed: agreementConfirmed
      })
      .select()

    if (insertError) throw insertError
    const created = (createdContracts || [])[0] as ContractRecord | undefined

    return created || null
  }

  const handleGenerateContracts = async () => {
    if (!user || !selectedContext) return
    setSaving(true)
    setError(null)

    try {
      const creatorWithContractDetails = resolveCreatorProfile()
      if (!creatorWithContractDetails) {
        setSaving(false)
        return
      }

      if (selectedContext.mode === 'owner') {
        if (selectedApplicantsList.length === 0) {
          setError('Sélectionnez au moins un participant accepté.')
          setSaving(false)
          return
        }

        for (const application of selectedApplicantsList) {
          if (!application.applicant) continue
          const created = await createContractForCounterparty({
            creatorWithContractDetails,
            counterparty: application.applicant,
            post: selectedContext.post,
            applicationId: application.id
          })

          if (created) {
            setContracts((prev) => [created, ...prev])
            await sendContractShareMessage({
              contractId: created.id,
              counterpartyId: application.applicant.id,
              postId: selectedContext.post.id,
              contractLabel: buildCurrentContractTitle(),
              contractContent: created.contract_content,
              contractStatus: created.status
            })
          }
        }
      }

      if (selectedContext.mode === 'applicant') {
        const created = await createContractForCounterparty({
          creatorWithContractDetails,
          counterparty: selectedContext.owner,
          post: selectedContext.post,
          applicationId: selectedContext.application.id
        })

        if (created) {
          setContracts((prev) => [created, ...prev])
          await sendContractShareMessage({
            contractId: created.id,
            counterpartyId: selectedContext.owner.id,
            postId: selectedContext.post.id,
            contractLabel: buildCurrentContractTitle(),
            contractContent: created.contract_content,
            contractStatus: created.status
          })
        }
      }

      handleResetForm()
      setActiveTab('list')
      showSuccess('Contrat généré, enregistré et envoyé dans la messagerie.')
    } catch (err) {
      console.error('Error generating contract:', err)
      setError('Impossible de générer le contrat pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenShareModal = async () => {
    if (!selectedContext) {
      flagMissingPostSelection()
      return
    }
    setError(null)
    setShareConversations([])
    setShareConversationsLoading(true)
    setShareModalOpen(true)
    setShareConversationSearch('')
    setSelectedShareConversationId(null)
    void loadShareConversations()
  }

  const handleShareContractToConversation = async () => {
    if (!user || !selectedShareConversationId) return
    if (!selectedContext) {
      flagMissingPostSelection()
      return
    }
    const selectedConversation = shareConversations.find((conv) => conv.id === selectedShareConversationId)
    const targetProfile = selectedConversation?.other_user
    if (!targetProfile?.id) {
      setError('Impossible de déterminer le profil destinataire.')
      return
    }

    setSharingContract(true)
    setError(null)
    try {
      const creatorWithContractDetails = resolveCreatorProfile()
      if (!creatorWithContractDetails) return

      let applicationId: string | null = null
      if (selectedContext.mode === 'owner') {
        const match = acceptedApplications.find(
          (app) => app.post_id === selectedContext.post.id && app.applicant_id === targetProfile.id
        )
        applicationId = match?.id || null
      } else if (selectedContext.mode === 'applicant') {
        applicationId = selectedContext.application.id
      }

      const created = await createContractForCounterparty({
        creatorWithContractDetails,
        counterparty: targetProfile,
        post: selectedContext.post,
        applicationId
      })

      if (!created) throw new Error('Contrat non créé')

      await sendContractShareMessageToConversation({
        contractId: created.id,
        conversationId: selectedShareConversationId,
        contractLabel: buildCurrentContractTitle(),
        contractContent: created.contract_content,
        contractStatus: created.status
      })

      setContracts((prev) => [created, ...prev])
      setShareModalOpen(false)
      showSuccess('Contrat envoyé dans la conversation.')
    } catch (err) {
      console.error('Error sharing contract to conversation:', err)
      setError('Impossible d’envoyer le contrat dans cette conversation.')
    } finally {
      setSharingContract(false)
    }
  }

  const isGenerateDisabled = () => {
    if (!selectedContext) return true
    if (selectedContext.mode === 'owner' && selectedApplicantsList.length === 0) return true
    if (shouldShowPrice && (!priceValue || Number(priceValue) <= 0)) return true
    if (shouldShowRevenueShare && (!revenueShare || Number(revenueShare) <= 0 || Number(revenueShare) > 100)) {
      return true
    }
    if (shouldShowExchange && exchangeService.trim().length === 0) return true
    return false
  }

  const canGenerateWithoutContext = !selectedContext
  const isGenerateDisabledForFields =
    saving || (Boolean(selectedContext) && isGenerateDisabled())

  const renderContractsList = () => {
    if (contracts.length === 0) {
      return (
        <div className="contracts-empty contracts-empty-marketing">
          <EmptyState
            type="category"
            customTitle="Cadre tes collaborations dès le départ."
            customSubtext="Crée un contrat en quelques minutes pour poser des règles claires."
            actionLabel="Créer un contrat"
            onAction={() => setActiveTab('create')}
            marketing
            marketingTone="blue"
          />
        </div>
      )
    }

    return (
      <div className="contracts-list">
        {contracts.map((contract) => {
          const contractTitle =
            paymentLabels[contract.contract_type] || paymentLabels[contract.payment_type || ''] || 'Contrat'
          const counterpartyName = formatUserName(
            contract.counterparty?.id === user?.id ? contract.creator : contract.counterparty
          )
          return (
            <div
              key={contract.id}
              className={`contracts-card ${sharedContractParam === contract.id ? 'contracts-card-highlight' : ''}`}
            >
              <div className="contracts-card-header">
                <div>
                  <h4>{contractTitle}</h4>
                  <p>{contract.post?.title || 'Annonce supprimée'}</p>
                </div>
                <span className={`contracts-status ${contract.status}`}>{contract.status}</span>
              </div>
              <div className="contracts-card-details">
                <span>Avec : {counterpartyName}</span>
                <span>Créé le : {formatDate(contract.created_at)}</span>
                {(contract.creator_accepted_at || contract.counterparty_accepted_at) && (
                  <span>
                    Accord: {contract.creator_accepted_at ? 'créateur' : ''}{contract.creator_accepted_at && contract.counterparty_accepted_at ? ' + ' : ''}{contract.counterparty_accepted_at ? 'autre partie' : ''}
                  </span>
                )}
              </div>
              <div className="contracts-card-actions">
                <button
                  className="contracts-secondary-btn"
                  onClick={() =>
                    downloadContractPdf(
                      contract.contract_content,
                      `contrat_${contract.post?.title || 'collaboration'}.pdf`
                    )
                  }
                >
                  <Download size={16} />
                  Télécharger PDF
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const canUsePortal = typeof document !== 'undefined'

  if (!user) {
    return (
      <div className="contracts-page">
        <div className="contracts-empty">
          <AlertCircle size={44} />
          <h4>Connexion requise</h4>
          <p>Connectez-vous pour accéder à vos contrats.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="contracts-page">
        <div className="contracts-loading">Chargement des contrats...</div>
      </div>
    )
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <p>Générez automatiquement des contrats pour vos collaborations.</p>
        </div>
      </div>

      <div className="contracts-tabs">
        <button
          className={`contracts-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Créer un contrat
        </button>
        <button
          className={`contracts-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Mes contrats
        </button>
      </div>

      {error && <div className="contracts-error">{error}</div>}

      {activeTab === 'create' ? (
        <div className="contracts-create">
          <div className="contracts-section">
            <h3>Informations contractuelles</h3>
            <p className="contracts-intro">
              {showContractIntro
                ? 'Renseignez vos informations contractuelles. Elles seront réutilisées automatiquement lors de la création d’un contrat.'
                : 'Renseignez vos informations contractuelles.'}
              <button
                type="button"
                className="contracts-link"
                onClick={() => setShowContractIntro((prev) => !prev)}
              >
                {showContractIntro ? 'Réduire' : 'Lire plus'}
              </button>
            </p>
            <div className="contracts-grid">
              <label>
                Nom du contrat
                <input
                  type="text"
                  value={contractName}
                  onChange={(event) => setContractName(event.target.value)}
                  placeholder="Ex: Contrat de collaboration"
                />
              </label>
              <label>
                Nom et prénom
                <input
                  type="text"
                  value={contractProfile.fullName}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Ex: Alex Martin"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={contractProfile.email}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Ex: contact@email.com"
                />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  value={contractProfile.phone}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Ex: 06 00 00 00 00"
                />
              </label>
              <label>
                Ville
                <input
                  type="text"
                  value={contractProfile.city}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="Ex: Paris"
                />
              </label>
              <label>
                Pays
                <input
                  type="text"
                  value={contractProfile.country}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, country: event.target.value }))}
                  placeholder="Ex: France"
                />
              </label>
              <label>
                SIREN (optionnel)
                <input
                  type="text"
                  value={contractProfile.siren}
                  onChange={(event) => setContractProfile((prev) => ({ ...prev, siren: event.target.value }))}
                  placeholder="Ex: 123 456 789"
                />
              </label>
              <div className="contracts-post-picker-field contracts-grid-wide">
                <div className="contracts-field-title">
                  <span>Choisir une annonce</span>
                </div>
                <button
                  type="button"
                  className={`contracts-post-picker-trigger ${showPostPicker ? 'open' : ''} ${postSelectionWarning ? 'warning' : ''}`}
                  onClick={() => setShowPostPicker(true)}
                >
                  <span>
                    {selectedContext?.post.title || 'Choisir une annonce'}
                  </span>
                  <span className="contracts-post-picker-trigger-action">
                    {selectedContext ? 'Changer' : 'Choisir'}
                  </span>
                </button>
              </div>
              {selectedContext && (
                <div className="contracts-grid-wide contracts-inline-payment-block">
                  <div className="contracts-grid">
                    <div className="contracts-grid-wide">
                      <label className="contracts-payment-picker-label">Moyen de paiement retenu</label>
                      <button
                        type="button"
                        className={`contracts-payment-picker-trigger ${showPaymentPicker ? 'open' : ''}`}
                        onClick={() => setShowPaymentPicker(true)}
                      >
                        <span>
                          {resolvedPaymentType
                            ? getPaymentOptionConfig(resolvedPaymentType)?.name || resolvedPaymentType
                            : 'Choisir un moyen de paiement'}
                        </span>
                        <span className="contracts-payment-picker-trigger-action">
                          {resolvedPaymentType ? 'Changer' : 'Choisir'}
                        </span>
                      </button>
                    </div>
                    {shouldShowPrice && (
                      <label>
                        Montant (€)
                        <input
                          type="number"
                          min="0"
                          value={priceValue}
                          onChange={(event) => setPriceValue(event.target.value)}
                          placeholder="Ex: 500"
                        />
                      </label>
                    )}
                    {shouldShowRevenueShare && (
                      <label>
                        Partage de revenus (%)
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={revenueShare}
                          onChange={(event) => setRevenueShare(event.target.value)}
                          placeholder="Ex: 30"
                        />
                      </label>
                    )}
                    {shouldShowExchange && (
                      <label>
                        Détail de l’échange
                        <input
                          type="text"
                          value={exchangeService}
                          onChange={(event) => setExchangeService(event.target.value)}
                          placeholder="Service rendu en échange"
                        />
                      </label>
                    )}
                    {shouldShowVisibiliteOfferType && (
                      <div className="contracts-grid-wide contracts-post-picker-field">
                        <div className="contracts-field-title">
                          <span>Tu offres quoi ? (visibilité / service)</span>
                        </div>
                        <button
                          type="button"
                          className={`contracts-post-picker-trigger ${showVisibiliteOfferTypePicker ? 'open' : ''}`}
                          onClick={() => setShowVisibiliteOfferTypePicker(true)}
                        >
                          <span>
                            {visibiliteOfferType === 'visibilite'
                              ? 'Visibilité'
                              : visibiliteOfferType === 'service'
                                ? 'Service'
                                : 'Choisir'}
                          </span>
                          <span className="contracts-post-picker-trigger-action">
                            {visibiliteOfferType ? 'Changer' : 'Choisir'}
                          </span>
                        </button>
                      </div>
                    )}
                    {shouldShowVisibiliteServiceDetails && (
                      <label className="contracts-grid-wide">
                        Détail du service offert
                        <textarea
                          className="contracts-textarea"
                          value={visibiliteServiceDetails}
                          onChange={(event) => setVisibiliteServiceDetails(event.target.value)}
                          placeholder="Décrivez le service offert dans le cadre de l'accord"
                        />
                      </label>
                    )}
                    {shouldShowCoCreationDetails && (
                      <label className="contracts-grid-wide">
                        Détails de co-création
                        <textarea
                          className="contracts-textarea"
                          value={coCreationDetails}
                          onChange={(event) => setCoCreationDetails(event.target.value)}
                          placeholder="Précisez la répartition créative / responsabilités / livrables"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
              <div className="contracts-textarea-field">
                <div className="contracts-field-title">
                  <span>Voir les articles par défaut</span>
                </div>
                <button
                  type="button"
                  className="contracts-secondary-btn"
                  onClick={() => setShowDefaultArticles((prev) => !prev)}
                >
                  {showDefaultArticles ? 'Masquer' : 'Afficher'}
                </button>
                {showDefaultArticles && (
                  <div className="contracts-default-articles">
                    {defaultArticles.length === 0 ? (
                      <div className="contracts-empty-inline">Aucun article par défaut.</div>
                    ) : (
                      defaultArticles.map((article, index) => (
                        <div key={`default-article-${index}`} className="contracts-default-article">
                          <div className="contracts-default-article-header">
                            <input
                              className="contracts-input"
                              type="text"
                              value={article.title}
                              onChange={(event) =>
                                setDefaultArticles((prev) => {
                                  setHasDefaultArticlesCustom(true)
                                  return prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, title: event.target.value } : item
                                  )
                                })
                              }
                              placeholder={`Titre de l'article ${index + 1}`}
                            />
                            <button
                              type="button"
                              className="contracts-remove-btn"
                              onClick={() => {
                                setDefaultArticles((prev) => {
                                  setHasDefaultArticlesCustom(true)
                                  return prev.filter((_, itemIndex) => itemIndex !== index)
                                })
                                showSuccess('Article supprimé.')
                              }}
                              aria-label="Supprimer l'article"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <textarea
                            className="contracts-textarea"
                            value={article.content}
                            onChange={(event) =>
                              setDefaultArticles((prev) => {
                                setHasDefaultArticlesCustom(true)
                                return prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, content: event.target.value } : item
                                )
                              })
                            }
                            placeholder="Contenu de l'article"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="contracts-textarea-field">
                <div className="contracts-field-title">
                  <span>Ajouter des articles</span>
                  {canAddCustomArticle && (
                    <button
                      type="button"
                      className="contracts-add-btn"
                      onClick={() => {
                        setCustomArticles((prev) => [...prev, ''])
                        showSuccess('Article ajouté.')
                      }}
                    >
                      + Ajouter
                    </button>
                  )}
                </div>
                {customArticles.map((article, index) => (
                  <div key={`article-${index}`} className="contracts-article-input">
                    <input
                      className="contracts-input"
                      type="text"
                      value={article}
                      onChange={(event) =>
                        setCustomArticles((prev) =>
                          prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                        )
                      }
                      placeholder={`Article ${index + 1}`}
                    />
                    {customArticles.length > 1 && (
                      <button
                        type="button"
                        className="contracts-remove-btn"
                        onClick={() => {
                          setCustomArticles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                          showSuccess('Article supprimé.')
                        }}
                        aria-label="Supprimer l'article"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <label>
                Signature
                <button
                  type="button"
                  className="contracts-signature-toggle"
                  onClick={() => setIsSignatureModalOpen(true)}
                >
                  {contractProfile.signature ? 'Signature enregistrée' : 'Ajouter une signature'}
                </button>
              </label>
            </div>
            <div className="contracts-actions">
              <button
                className="contracts-primary-btn"
                onClick={handleSaveContractProfile}
                disabled={contractProfileSaving}
              >
                {contractProfileSaving ? 'Enregistrement...' : 'Enregistrer les informations'}
              </button>
              {contractProfileSaved && <span className="contracts-save-hint">Enregistré</span>}
            </div>
          </div>

          {selectedContext && (
            <>
              {showPaymentPicker && (
                canUsePortal && createPortal((
                  <div className="contracts-payment-sheet-overlay" onClick={() => setShowPaymentPicker(false)}>
                    <div
                      className="contracts-payment-sheet"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="contracts-payment-sheet-header">
                        <h3>Moyen de paiement</h3>
                        <button
                          type="button"
                          className="contracts-payment-sheet-close"
                          onClick={() => setShowPaymentPicker(false)}
                          aria-label="Fermer"
                        >
                          ×
                        </button>
                      </div>
                      <p className="contracts-payment-sheet-help">
                        Choisissez un moyen de paiement. Le panneau se ferme après votre choix.
                      </p>
                      <div className="contracts-payment-sheet-list">
                        <CustomList
                          items={paymentOptions}
                          selectedId={resolvedPaymentType || ''}
                          onSelectItem={(optionId) => {
                            setSelectedPaymentType(optionId)
                            setShowPaymentPicker(false)
                          }}
                          className="payment-options-list publish-list contracts-publish-list"
                          showCheckbox={false}
                          showDescription={true}
                          truncateDescription={false}
                        />
                      </div>
                    </div>
                  </div>
                ), document.body)
              )}

              {shouldShowVisibiliteOfferType && showVisibiliteOfferTypePicker && (
                canUsePortal && createPortal((
                  <div className="contracts-payment-sheet-overlay" onClick={() => setShowVisibiliteOfferTypePicker(false)}>
                    <div
                      className="contracts-payment-sheet"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="contracts-payment-sheet-header">
                        <h3>Tu offres quoi ?</h3>
                        <button
                          type="button"
                          className="contracts-payment-sheet-close"
                          onClick={() => setShowVisibiliteOfferTypePicker(false)}
                          aria-label="Fermer"
                        >
                          ×
                        </button>
                      </div>
                      <p className="contracts-payment-sheet-help">
                        Choisissez si vous proposez de la visibilité ou un service.
                      </p>
                      <div className="contracts-payment-sheet-list">
                        <CustomList
                          items={visibiliteOfferTypeOptions}
                          selectedId={visibiliteOfferType || ''}
                          onSelectItem={(optionId) => {
                            setVisibiliteOfferType(optionId as '' | 'visibilite' | 'service')
                            if (optionId !== 'service') {
                              setVisibiliteServiceDetails('')
                            }
                            setShowVisibiliteOfferTypePicker(false)
                          }}
                          className="publish-list contracts-publish-list"
                          showCheckbox={false}
                          showDescription={true}
                          truncateDescription={false}
                        />
                      </div>
                    </div>
                  </div>
                ), document.body)
              )}

            </>
          )}

          <div className="contracts-section contracts-preview-section">
            <div className="contracts-preview-title">
              <button
                type="button"
                className={`contracts-preview-toggle ${showContractPreviewPanel ? 'open' : ''}`}
                onClick={() => setShowContractPreviewPanel((prev) => !prev)}
                aria-expanded={showContractPreviewPanel}
              >
                <Eye size={18} />
                <span className="contracts-preview-toggle-main">Aperçu du contrat</span>
                <span className="contracts-preview-toggle-state">
                  {showContractPreviewPanel ? 'Masquer' : 'Voir'}
                </span>
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                className="contracts-preview-share-icon"
                title="Envoyer ce contrat par message"
                onClick={() => void handleOpenShareModal()}
                disabled={saving}
              >
                <Share2 size={16} />
              </button>
            </div>
            {showContractPreviewPanel && (
              <>
                <div className="contracts-preview-meta">{previewCounterpartyLabel}</div>
                <div className="contracts-preview">{previewContractContent}</div>
                <div className="contracts-actions">
                  <button
                    type="button"
                    className="contracts-secondary-btn contracts-preview-download-btn"
                    onClick={() => {
                      const postTitle = selectedContext?.post.title || 'contrat'
                      const creatorProfile = resolveCreatorProfile()
                      downloadContractPdf(
                        previewContractContent,
                        buildContractFileName(postTitle, previewCounterparty),
                        creatorProfile && selectedContext
                          ? buildContractPdfData({
                              creator: creatorProfile,
                              counterparty: previewCounterparty,
                              post: selectedContext.post,
                              paymentType: resolvedPaymentType,
                              contractKind: resolvedContractType
                            })
                          : undefined
                      )
                    }}
                  >
                    <Download size={16} />
                    Télécharger le contrat
                  </button>
                  <button
                    type="button"
                    className="contracts-primary-btn contracts-preview-send-btn"
                    disabled={isGenerateDisabledForFields && !canGenerateWithoutContext}
                    onClick={() => {
                      if (!selectedContext) {
                        flagMissingPostSelection()
                        return
                      }
                      void handleGenerateContracts()
                    }}
                  >
                    {saving ? 'Envoi...' : 'Envoyer le contrat'}
                  </button>
                  <button
                    type="button"
                    className="contracts-secondary-btn contracts-preview-reset-btn"
                    onClick={() => void handleResetWithDraftPrompt()}
                  >
                    Réinitialiser
                  </button>
                </div>
              </>
            )}
          </div>

          {selectedContext && selectedContext.mode === 'applicant' && (
            <div className="contracts-section">
              <h3>Autre utilisateur</h3>
              <div className="contracts-opponent">
                <Users size={18} />
                <span>{formatUserName(selectedContext.owner)}</span>
              </div>
            </div>
          )}

          <div className="contracts-section">
            <button
              type="button"
              className={`contracts-drafts-toggle ${showDraftsPanel ? 'open' : ''}`}
              onClick={() => setShowDraftsPanel((prev) => !prev)}
              aria-expanded={showDraftsPanel}
            >
              <span>{showDraftsPanel ? 'Masquer les brouillons' : 'Voir les brouillons'}</span>
              <ChevronDown size={16} />
            </button>

            {showDraftsPanel && (
              drafts.length === 0 ? (
                <div className="contracts-empty-inline">Aucun brouillon pour le moment.</div>
              ) : (
                <div className="contracts-drafts-list">
                  {drafts.map((draft) => {
                    const snapshot = draft.draft || {}
                    const label =
                      snapshot.contract_name?.trim() ||
                      (snapshot.selected_option ? `Brouillon • ${snapshot.selected_option.replace(':', ' ')}` : 'Brouillon sans titre')
                    return (
                      <div
                        key={draft.id}
                        className={`contracts-draft-item ${activeDraftId === draft.id ? 'active' : ''}`}
                      >
                        <button
                          type="button"
                          className="contracts-draft-main"
                          onClick={() => handleLoadDraft(draft)}
                        >
                          <span className="contracts-draft-title">{label}</span>
                          <span className="contracts-draft-meta">
                            Mis à jour le {formatDate(draft.updated_at)} {activeDraftId === draft.id ? '• actif' : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="contracts-draft-delete"
                          aria-label="Supprimer définitivement le brouillon"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleDeleteDraft(draft.id)
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        renderContractsList()
      )}

      {shareModalOpen && (
        canUsePortal && createPortal((
          <div
            className="contracts-payment-sheet-overlay contracts-share-sheet-overlay"
            onClick={() => setShareModalOpen(false)}
          >
            <div
              className="contracts-payment-sheet contracts-share-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="contracts-share-modal-header">
                <h3>Envoyer le contrat par message</h3>
              </div>
              <div className="contracts-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={shareConversationSearch}
                  onChange={(event) => setShareConversationSearch(event.target.value)}
                  placeholder="Rechercher une conversation..."
                />
              </div>
              <div className="contracts-share-conversations-list">
                {shareConversationsLoading ? (
                  <div className="contracts-empty-inline">Chargement des conversations...</div>
                ) : filteredShareConversations.length === 0 ? (
                  <div className="contracts-empty-inline">Aucune conversation trouvée.</div>
                ) : (
                  filteredShareConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`contracts-share-conversation-item ${selectedShareConversationId === conversation.id ? 'active' : ''}`}
                      onClick={() => setSelectedShareConversationId(conversation.id)}
                    >
                      <div className="contracts-share-conversation-avatar">
                        {conversation.other_user?.avatar_url ? (
                          <img src={conversation.other_user.avatar_url} alt={formatUserName(conversation.other_user)} />
                        ) : (
                          <span>{(formatUserName(conversation.other_user) || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="contracts-share-conversation-meta">
                        <strong>{formatUserName(conversation.other_user)}</strong>
                        <span>
                          {conversation.last_message_at ? `Dernier message: ${formatDate(conversation.last_message_at)}` : 'Conversation'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="contracts-modal-actions">
                <button
                  className="contracts-primary-btn"
                  type="button"
                  onClick={handleShareContractToConversation}
                  disabled={!selectedShareConversationId || sharingContract}
                >
                  <Send size={16} />
                  {sharingContract ? 'Envoi...' : 'Envoyer le contrat'}
                </button>
              </div>
            </div>
          </div>
        ), document.body)
      )}

      {showPostPicker && (
        canUsePortal && createPortal((
          <div className="contracts-payment-sheet-overlay" onClick={() => setShowPostPicker(false)}>
            <div
              className="contracts-payment-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="contracts-payment-sheet-header">
                <h3>Choisir une annonce</h3>
                <button
                  type="button"
                  className="contracts-payment-sheet-close"
                  onClick={() => setShowPostPicker(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              <div className="contracts-search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={contractPostSearch}
                  onChange={(event) => setContractPostSearch(event.target.value)}
                  placeholder="Rechercher dans mes annonces actives..."
                />
              </div>
              <div className="contracts-post-sheet-list">
                {filteredOwnedPosts.length === 0 ? (
                  <div className="contracts-empty-inline">Aucune annonce active trouvée.</div>
                ) : (
                  filteredOwnedPosts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      className={`contracts-post-sheet-item ${selectedOption === `owner:${post.id}` ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedOption(`owner:${post.id}`)
                        setShowPostPicker(false)
                      }}
                    >
                      <span className="contracts-post-sheet-item-name">{post.title}</span>
                    </button>
                  ))
                )}

                {acceptedAsApplicant.length > 0 && (
                  <div className="contracts-post-sheet-group-label">Annonces où je suis accepté</div>
                )}
                {acceptedAsApplicant.map((application) => (
                  <button
                    key={application.id}
                    type="button"
                    className={`contracts-post-sheet-item ${selectedOption === `applicant:${application.id}` ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedOption(`applicant:${application.id}`)
                      setShowPostPicker(false)
                    }}
                  >
                    <span className="contracts-post-sheet-item-name">
                      {applicantPostMap[application.post_id]?.title || 'Annonce'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ), document.body)
      )}

      {isSignatureModalOpen && (
        canUsePortal && createPortal((
          <div className="contracts-modal-overlay" onClick={() => setIsSignatureModalOpen(false)}>
            <div className="contracts-modal" onClick={(event) => event.stopPropagation()}>
              <h3>Signature</h3>
              <p>Ajoutez votre signature en noir. Vous pouvez effacer et recommencer.</p>
              <div className="contracts-signature">
                <canvas
                  ref={signatureCanvasRef}
                  className="contracts-signature-canvas"
                  onMouseDown={startSignature}
                  onMouseMove={drawSignature}
                  onMouseUp={endSignature}
                  onMouseLeave={endSignature}
                  onTouchStart={startSignature}
                  onTouchMove={drawSignature}
                  onTouchEnd={endSignature}
                />
                {!signatureHasData && <span className="contracts-signature-placeholder">Signez ici</span>}
              </div>
              <div className="contracts-modal-actions">
                <button className="contracts-secondary-btn" type="button" onClick={clearSignature}>
                  Effacer
                </button>
                <button className="contracts-secondary-btn" type="button" onClick={() => setIsSignatureModalOpen(false)}>
                  Fermer
                </button>
                <button className="contracts-primary-btn" type="button" onClick={handleSaveSignature}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        ), document.body)
      )}

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

export default Contracts
