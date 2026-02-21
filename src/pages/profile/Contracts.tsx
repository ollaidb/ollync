import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { MouseEvent, TouchEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, CheckCircle2, Download, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useToastContext } from '../../contexts/ToastContext'
import { EmptyState } from '../../components/EmptyState'
import type { Database } from '../../types/database'
import './Contracts.css'

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
  payment_type?: string | null
  price?: number | null
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
  post?: { title?: string | null } | null
  counterparty?: ProfileSummary | null
  creator?: ProfileSummary | null
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

const Contracts = () => {
  const { user } = useAuth()
  const { showSuccess } = useToastContext()
  const [searchParams] = useSearchParams()
  const counterpartyParam = searchParams.get('counterparty')
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
  const [contractName, setContractName] = useState<string>('')
  const [priceValue, setPriceValue] = useState<string>('')
  const [revenueShare, setRevenueShare] = useState<string>('')
  const [exchangeService, setExchangeService] = useState<string>('')
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

  const ownerPostsWithAccepted = useMemo(() => {
    if (acceptedApplications.length === 0) return []
    const acceptedPostIds = new Set(acceptedApplications.map((app) => app.post_id))
    return ownedPosts.filter((post) => acceptedPostIds.has(post.id))
  }, [acceptedApplications, ownedPosts])

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

  const resolvedPaymentType = selectedContext?.post.payment_type || null
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

  const contractTypeOptions = [
    { id: 'auto', label: 'Auto (selon le paiement)' },
    { id: 'remuneration', label: 'Rémunération' },
    { id: 'prix', label: 'Prix' },
    { id: 'echange', label: 'Échange de service' },
    { id: 'visibilite-contre-service', label: 'Visibilité contre service' },
    { id: 'co-creation', label: 'Co-création' },
    { id: 'participation', label: 'Participation' },
    { id: 'collaboration', label: 'Collaboration' }
  ]

  const shouldShowRevenueShare = resolvedContractType === 'partage-revenus'
  const shouldShowPrice = resolvedContractType === 'remuneration' || resolvedContractType === 'prix'
  const shouldShowExchange =
    resolvedContractType === 'echange' || resolvedContractType === 'visibilite-contre-service'

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
    const loadDraft = async () => {
      if (!user || draftLoaded || loading) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('contract_drafts') as any)
          .select('draft')
          .eq('user_id', user.id)
          .maybeSingle()

        const draft = (data?.draft || null) as {
          contract_name?: string
          selected_option?: string
          contract_type?: string
          price_value?: string
          revenue_share?: string
          exchange_service?: string
          custom_clauses?: string
          custom_articles?: string[]
          agreement_confirmed?: boolean
          default_articles?: { title: string; content: string }[]
          selected_applicants?: Record<string, boolean>
        } | null

        if (draft) {
          skipNextDraftSave.current = true
          setContractName(draft.contract_name || '')
          setSelectedOption(draft.selected_option || '')
          setContractType(draft.contract_type || 'auto')
          setPriceValue(draft.price_value || '')
          setRevenueShare(draft.revenue_share || '')
          setExchangeService(draft.exchange_service || '')
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
          }
        }
      } catch (err) {
        console.error('Error loading contract draft:', err)
      } finally {
        setDraftLoaded(true)
      }
    }

    loadDraft()
  }, [draftLoaded, loading, user])

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
        price_value: priceValue,
        revenue_share: revenueShare,
        exchange_service: exchangeService,
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
        await (supabase.from('contract_drafts') as any).upsert(payload, { onConflict: 'user_id' })
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
    priceValue,
    revenueShare,
    selectedApplicants,
    selectedOption,
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
    if (isSignatureModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSignatureModalOpen])

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
            .select('id, title, description, payment_type, price, number_of_people, user_id, created_at')
            .eq('user_id', user.id)
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
              .select('id, title, description, payment_type, price, number_of_people, user_id, created_at')
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
  }, [shouldShowExchange, shouldShowPrice, shouldShowRevenueShare])

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
  }, [acceptedApplications, preferredCounterpartyId, priceValue, selectedContext])

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
    if (shouldShowPrice && priceValue) {
      remunerationDetails.push(`Montant convenu : ${priceValue} €`)
    }
    if (shouldShowRevenueShare && revenueShare) {
      remunerationDetails.push(`Partage de revenus : ${revenueShare}%`)
    }
    if (shouldShowExchange && exchangeService.trim()) {
      remunerationDetails.push(`Échange de service : ${exchangeService.trim()}`)
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

  const handleToggleApplicant = (applicationId: string) => {
    setSelectedApplicants((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }))
  }

  const handleResetForm = () => {
    setSelectedApplicants({})
    setSelectedOption('')
    setContractType('auto')
    setContractName('')
    setPriceValue('')
    setRevenueShare('')
    setExchangeService('')
    setCustomArticles([''])
    setCustomClauses('')
    setAgreementConfirmed(false)
    setHasDefaultArticlesCustom(false)
    setDefaultArticles(legalArticles)
    showSuccess('Formulaire réinitialisé.')
  }

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
          const contractContent = buildContractContent({
            creator: creatorWithContractDetails,
            counterparty: application.applicant,
            post: selectedContext.post,
            paymentType: resolvedPaymentType,
            contractKind: resolvedContractType
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: createdContracts, error: insertError } = await (supabase.from('contracts') as any)
            .insert({
              post_id: selectedContext.post.id,
              application_id: application.id,
              creator_id: user.id,
              counterparty_id: application.applicant.id,
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

          if (insertError) {
            throw insertError
          }

          const created = (createdContracts || [])[0] as ContractRecord | undefined
          const fileName = buildContractFileName(selectedContext.post.title, application.applicant)
          downloadContractPdf(
            contractContent,
            fileName,
            buildContractPdfData({
              creator: creatorWithContractDetails,
              counterparty: application.applicant,
              post: selectedContext.post,
              paymentType: resolvedPaymentType,
              contractKind: resolvedContractType
            })
          )

          if (created) {
            setContracts((prev) => [created, ...prev])
          }
        }
      }

      if (selectedContext.mode === 'applicant') {
        const contractContent = buildContractContent({
          creator: creatorWithContractDetails,
          counterparty: selectedContext.owner,
          post: selectedContext.post,
          paymentType: resolvedPaymentType,
          contractKind: resolvedContractType
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: createdContracts, error: insertError } = await (supabase.from('contracts') as any)
          .insert({
            post_id: selectedContext.post.id,
            application_id: selectedContext.application.id,
            creator_id: user.id,
            counterparty_id: selectedContext.owner.id,
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

        if (insertError) {
          throw insertError
        }

        const created = (createdContracts || [])[0] as ContractRecord | undefined
        downloadContractPdf(
          contractContent,
          buildContractFileName(selectedContext.post.title, selectedContext.owner),
          buildContractPdfData({
            creator: creatorWithContractDetails,
            counterparty: selectedContext.owner,
            post: selectedContext.post,
            paymentType: resolvedPaymentType,
            contractKind: resolvedContractType
          })
        )

        if (created) {
          setContracts((prev) => [created, ...prev])
        }
      }

      handleResetForm()
      setActiveTab('list')
      showSuccess('Contrat généré et enregistré.')
    } catch (err) {
      console.error('Error generating contract:', err)
      setError('Impossible de générer le contrat pour le moment.')
    } finally {
      setSaving(false)
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
            <div key={contract.id} className="contracts-card">
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
              <label>
                Choisir une annonce
                <select
                  className="contracts-select"
                  value={selectedOption}
                  onChange={(event) => setSelectedOption(event.target.value)}
                >
                  <option value="">Sélectionner une annonce...</option>
                  {ownerPostsWithAccepted.length > 0 && (
                    <optgroup label="Mes annonces matchées">
                      {ownerPostsWithAccepted.map((post) => (
                        <option key={post.id} value={`owner:${post.id}`}>
                          {post.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {acceptedAsApplicant.length > 0 && (
                    <optgroup label="Annonces où je suis accepté">
                      {acceptedAsApplicant.map((application) => (
                        <option key={application.id} value={`applicant:${application.id}`}>
                          {applicantPostMap[application.post_id]?.title || 'Annonce'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
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
              <div className="contracts-section">
                <h3>Type de contrat</h3>
                <p>Le type est proposé automatiquement selon le moyen de paiement.</p>
                <div className="contracts-row">
                  <select
                    className="contracts-select"
                    value={contractType}
                    onChange={(event) => setContractType(event.target.value)}
                  >
                    {contractTypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="contracts-payment-chip">
                    {paymentLabels[resolvedPaymentType || ''] || 'Paiement non défini'}
                  </div>
                </div>
              </div>

              <div className="contracts-section">
                <h3>Informations de paiement</h3>
                <div className="contracts-grid">
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
                </div>
              </div>

              <div className="contracts-section">
                <h3>Articles automatiques</h3>
                <div className="contracts-articles">
                  {defaultArticles.map((article, index) => (
                    <div key={`${article.title}-${index}`} className="contracts-article">
                      <CheckCircle2 size={18} />
                      <div>
                        <strong>
                          Article {index + 1} — {article.title}
                        </strong>
                        <p>{article.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="contracts-section">
                <h3>Clauses additionnelles</h3>
                <textarea
                  className="contracts-textarea"
                  value={customClauses}
                  onChange={(event) => setCustomClauses(event.target.value)}
                  placeholder="Ajoutez ici les clauses sur lesquelles vous êtes d’accord avec l’autre partie."
                />
              </div>

              <div className="contracts-section">
                <label className="contracts-checkbox">
                  <input
                    type="checkbox"
                    checked={agreementConfirmed}
                    onChange={(event) => setAgreementConfirmed(event.target.checked)}
                  />
                  Je confirme que ces clauses ont été validées avec l’autre partie.
                </label>
              </div>
            </>
          )}

          <div className="contracts-section contracts-preview-section">
            <div className="contracts-preview-title">
              <Eye size={18} />
              <h3>Aperçu du contrat</h3>
            </div>
            <p className="contracts-intro">
              Le contrat ci-dessous est généré automatiquement avec les informations déjà remplies.
            </p>
            <div className="contracts-preview-meta">{previewCounterpartyLabel}</div>
            <div className="contracts-preview">{previewContractContent}</div>
            <div className="contracts-actions">
              <button
                className="contracts-secondary-btn"
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
                className="contracts-primary-btn"
                disabled={isGenerateDisabled() || saving}
                onClick={handleGenerateContracts}
              >
                {saving ? 'Envoi...' : 'Envoyer le contrat'}
              </button>
              <button className="contracts-secondary-btn" onClick={handleResetForm}>
                Réinitialiser
              </button>
            </div>
          </div>

          {selectedContext && selectedContext.mode === 'owner' && (
            <div className="contracts-section">
              <h3>Sélectionner les participants</h3>
              <p>Vous pouvez générer plusieurs contrats pour la même annonce.</p>
              <div className="contracts-applicants">
                {acceptedApplications.filter((app) => app.post_id === selectedContext.post.id).length === 0 ? (
                  <div className="contracts-empty-inline">
                    Aucune candidature acceptée pour cette annonce.
                  </div>
                ) : (
                  acceptedApplications
                    .filter((app) => app.post_id === selectedContext.post.id)
                    .map((application) => (
                      <label key={application.id} className="contracts-applicant">
                        <input
                          type="checkbox"
                          checked={!!selectedApplicants[application.id]}
                          onChange={() => handleToggleApplicant(application.id)}
                        />
                        <span>{formatUserName(application.applicant)}</span>
                      </label>
                    ))
                )}
              </div>
            </div>
          )}

          {selectedContext && selectedContext.mode === 'applicant' && (
            <div className="contracts-section">
              <h3>Autre utilisateur</h3>
              <div className="contracts-opponent">
                <Users size={18} />
                <span>{formatUserName(selectedContext.owner)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        renderContractsList()
      )}

      {isSignatureModalOpen && (
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
      )}
    </div>
  )
}

export default Contracts
