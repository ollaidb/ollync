import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Users, CheckCircle2, Download, FileSignature, AlertCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './Contracts.css'

interface ProfileSummary {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
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

const Contracts = () => {
  const { user } = useAuth()
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
  const [priceValue, setPriceValue] = useState<string>('')
  const [revenueShare, setRevenueShare] = useState<string>('')
  const [exchangeService, setExchangeService] = useState<string>('')
  const [customClauses, setCustomClauses] = useState<string>('')
  const [agreementConfirmed, setAgreementConfirmed] = useState(false)

  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [preferredCounterpartyId, setPreferredCounterpartyId] = useState<string | null>(null)

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

  const resolvedPaymentType = selectedContext?.post.payment_type || null
  const resolvedContractType = contractType === 'auto' ? resolvedPaymentType || 'collaboration' : contractType

  const paymentLabels: Record<string, string> = {
    remuneration: 'Rémunération',
    prix: 'Prix',
    'partage-revenus': 'Partage de revenus',
    echange: 'Échange de service',
    'co-creation': 'Co-création',
    participation: 'Participation',
    association: 'Association',
    collaboration: 'Collaboration'
  }

  const contractTypeOptions = [
    { id: 'auto', label: 'Auto (selon le paiement)' },
    { id: 'partage-revenus', label: 'Partage de revenus' },
    { id: 'remuneration', label: 'Rémunération' },
    { id: 'prix', label: 'Prix' },
    { id: 'echange', label: 'Échange de service' },
    { id: 'co-creation', label: 'Co-création' },
    { id: 'participation', label: 'Participation' },
    { id: 'association', label: 'Association' },
    { id: 'collaboration', label: 'Collaboration' }
  ]

  const shouldShowRevenueShare = resolvedContractType === 'partage-revenus'
  const shouldShowPrice = resolvedContractType === 'remuneration' || resolvedContractType === 'prix'
  const shouldShowExchange = resolvedContractType === 'echange'

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
    if (!user) return
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', user.id)
          .single()
        if (!profileError && profileData) {
          setCurrentUserProfile(profileData)
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
              applicant:profiles!applications_applicant_id_fkey(id, username, full_name, avatar_url)
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
              .select('id, username, full_name, avatar_url')
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

        await loadContracts()
      } catch (err) {
        console.error('Error loading contracts data:', err)
        setError('Une erreur est survenue lors du chargement des contrats.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    setPreferredCounterpartyId(counterpartyParam)
  }, [counterpartyParam])

  const loadContracts = async () => {
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
  }

  useEffect(() => {
    setSelectedApplicants({})
  }, [selectedOption])

  useEffect(() => {
    if (!shouldShowPrice) setPriceValue('')
    if (!shouldShowRevenueShare) setRevenueShare('')
    if (!shouldShowExchange) setExchangeService('')
  }, [shouldShowExchange, shouldShowPrice, shouldShowRevenueShare])

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
    return profile.full_name || profile.username || 'Utilisateur'
  }

  const formatDate = (value?: string | null) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('fr-FR')
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
    const title = `Contrat ${paymentLabels[contractKind] || 'Collaboration'}`
    const paymentLine = paymentType ? paymentLabels[paymentType] || paymentType : 'Non précisé'
    const today = formatDate(new Date().toISOString())

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

    const remunerationText =
      remunerationDetails.length > 0
        ? remunerationDetails.join(' - ')
        : 'Les modalités financières seront précisées entre les parties.'

    const customClauseText = customClauses.trim()
      ? `\nClauses additionnelles :\n${customClauses.trim()}`
      : ''

    const articleText = legalArticles
      .map((article, index) => `Article ${index + 1} : ${article.title}\n${article.content}`)
      .join('\n\n')

    return [
      `${title}`,
      `Date : ${today}`,
      '',
      `Parties :`,
      `- ${formatUserName(creator)} (Créateur du contrat)`,
      `- ${formatUserName(counterparty)} (Autre partie)`,
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
      `Accord mutuel : ${agreementConfirmed ? 'Confirmé par les parties' : 'En attente de confirmation'}`
    ]
      .filter((line) => line !== '')
      .join('\n\n')
  }

  const downloadContractPdf = (content: string, fileName: string) => {
    const doc = new jsPDF({ format: 'a4', unit: 'pt' })
    const margin = 48
    const lineHeight = 16
    const pageHeight = doc.internal.pageSize.height
    const maxWidth = doc.internal.pageSize.width - margin * 2
    const lines = doc.splitTextToSize(content, maxWidth)
    let y = margin

    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    })

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
    setPriceValue('')
    setRevenueShare('')
    setExchangeService('')
    setCustomClauses('')
    setAgreementConfirmed(false)
  }

  const handleGenerateContracts = async () => {
    if (!user || !selectedContext) return
    setSaving(true)
    setError(null)

    try {
      const creator = currentUserProfile || {
        id: user.id,
        username: user.user_metadata?.username || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null
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
            creator,
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
          const safeName = formatUserName(application.applicant).replace(/\s+/g, '_')
          const fileName = `contrat_${selectedContext.post.title}_${safeName}.pdf`
          downloadContractPdf(contractContent, fileName)

          if (created) {
            setContracts((prev) => [created, ...prev])
          }
        }
      }

      if (selectedContext.mode === 'applicant') {
        const contractContent = buildContractContent({
          creator,
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
        downloadContractPdf(contractContent, `contrat_${selectedContext.post.title}.pdf`)

        if (created) {
          setContracts((prev) => [created, ...prev])
        }
      }

      handleResetForm()
      setActiveTab('list')
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
        <div className="contracts-empty">
          <FileText size={44} />
          <h4>Aucun contrat pour l’instant</h4>
          <p>Créez votre premier contrat pour sécuriser vos collaborations.</p>
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
          <h2>Contrats</h2>
          <p>Générez automatiquement des contrats pour vos collaborations.</p>
        </div>
      </div>

      <div className="contracts-tabs">
        <button
          className={`contracts-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <FileSignature size={18} />
          Créer un contrat
        </button>
        <button
          className={`contracts-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FileText size={18} />
          Mes contrats
        </button>
      </div>

      {error && <div className="contracts-error">{error}</div>}

      {activeTab === 'create' ? (
        <div className="contracts-create">
          <div className="contracts-section">
            <h3>1. Choisir une annonce</h3>
            <p>Sélectionnez l’annonce concernée pour associer automatiquement l’autre partie.</p>
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
          </div>

          {selectedContext && selectedContext.mode === 'owner' && (
            <div className="contracts-section">
              <h3>2. Sélectionner les participants</h3>
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
              <h3>2. Autre utilisateur</h3>
              <div className="contracts-opponent">
                <Users size={18} />
                <span>{formatUserName(selectedContext.owner)}</span>
              </div>
            </div>
          )}

          {selectedContext && (
            <>
              <div className="contracts-section">
                <h3>3. Type de contrat</h3>
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
                <h3>4. Informations de paiement</h3>
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
                <h3>5. Articles automatiques</h3>
                <div className="contracts-articles">
                  {legalArticles.map((article, index) => (
                    <div key={article.title} className="contracts-article">
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
                <h3>6. Clauses additionnelles</h3>
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

              <div className="contracts-actions">
                <button
                  className="contracts-primary-btn"
                  disabled={isGenerateDisabled() || saving}
                  onClick={handleGenerateContracts}
                >
                  {saving ? 'Génération...' : 'Générer le contrat PDF'}
                </button>
                <button className="contracts-secondary-btn" onClick={handleResetForm}>
                  Réinitialiser
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        renderContractsList()
      )}
    </div>
  )
}

export default Contracts
