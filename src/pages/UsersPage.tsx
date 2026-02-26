import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Check, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import { useIsMobile } from '../hooks/useIsMobile'
import BackButton from '../components/BackButton'
import { PullToRefresh } from '../components/PullToRefresh/PullToRefresh'
import { EmptyState } from '../components/EmptyState'
import { publicationTypes } from '../constants/publishData'
import './UsersPage.css'

interface User {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  profile_type?: string | null
  display_subcategories?: string[] | null
  email?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

// Ordre des catégories (même que dans SwipePage)
const categoryOrder = [
  'creation-contenu',
  'casting-role',
  'emploi',
  'studio-lieu',
  'services',
  'evenements',
  'vente'
]

const MODERATOR_EMAIL = 'binta22116@gmail.com'
const PROFILE_TYPE_FILTER_OPTIONS = [
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
  { id: 'analyse-profil', label: 'Analyse de profil' }
]

const isModeratorEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === MODERATOR_EMAIL

const UsersPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { t } = useTranslation(['categories'])
  const categoryId = searchParams.get('category')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<string>('all')
  const [pendingSubcategory, setPendingSubcategory] = useState<string>('all')
  const [pendingStatus, setPendingStatus] = useState<string>('all')
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [supportsShowInUsers, setSupportsShowInUsers] = useState<boolean | null>(null)
  const [supportsDisplaySubcategories, setSupportsDisplaySubcategories] = useState<boolean | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  const USERS_PER_PAGE = 20

  // Générer les filtres dynamiquement depuis les catégories
  const filters = useMemo(() => {
    const translateCategory = (category: Category) =>
      t(`categories:titles.${category.slug}`, { defaultValue: category.name })
    return [
      { id: 'all', label: t('categories:submenus.tout') },
      ...categories
        .filter(cat => categoryOrder.includes(cat.slug))
        .sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.slug)
          const indexB = categoryOrder.indexOf(b.slug)
          return indexA - indexB
        })
        .map(cat => ({
          id: cat.slug,
          label: translateCategory(cat)
        }))
    ]
  }, [categories, t])

  const profileTypeLabelMap = useMemo(() => ({
    creator: 'Créateur(trice) de contenu',
    freelance: 'Prestataire / Freelance',
    company: 'Entreprise',
    studio: 'Studio / Lieu',
    institut: 'Institut / Beauté',
    'community-manager': 'Community manager',
    monteur: 'Monteur(euse)',
    animateur: 'Animateur(rice)',
    redacteur: 'Rédacteur(rice)',
    scenariste: 'Scénariste',
    coach: 'Coach',
    agence: 'Agence',
    branding: 'Branding',
    'analyse-profil': 'Analyse de profil',
    other: 'Autre'
  }), [])

  const parseTextArray = (value: unknown) => {
    if (!value) return [] as string[]
    if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean)
      } catch {
        return value.split(',').map((item) => item.trim()).filter(Boolean)
      }
    }
    return [] as string[]
  }

  const subcategoryFilterOptions = useMemo(() => {
    if (!pendingCategory || pendingCategory === 'all') return []
    const category = publicationTypes.find((item) => item.slug === pendingCategory)
    if (!category) return []
    return category.subcategories
      .filter((sub) => sub.slug !== 'tout')
      .map((sub) => ({
        id: `${category.slug}::${sub.slug}`,
        label: sub.name
      }))
  }, [pendingCategory])

  const activeFilterCount = useMemo(() => (
    [selectedSubcategory, selectedStatus].filter((value) => value !== 'all').length
  ), [selectedSubcategory, selectedStatus])

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

  // Récupérer les catégories
  useEffect(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
        } else if (data) {
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const fetchFollowingStatus = useCallback(async (userIds: string[]) => {
    if (!user || userIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds)

      if (error) {
        console.error('Error fetching follow status:', error)
        return
      }

      setFollowingMap((prev) => {
        const next = { ...prev }
        userIds.forEach((id) => {
          next[id] = false
        })
        data?.forEach((row: { following_id: string }) => {
          next[row.following_id] = true
        })
        return next
      })
    } catch (error) {
      console.error('Error fetching follow status:', error)
    }
  }, [user])

  const fetchUsers = useCallback(async (pageNum: number) => {
    if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Trouver la catégorie si un filtre est sélectionné
      let activeCategorySlug: string | undefined
      if (selectedCategory !== 'all') {
        activeCategorySlug = selectedCategory
      } else if (categoryId) {
        // Si on vient d'un lien avec categoryId, l'utiliser
        const category = categories.find(c => c.id === categoryId)
        if (category) {
          activeCategorySlug = category.slug
        }
      }

      const start = pageNum * USERS_PER_PAGE
      const end = start + USERS_PER_PAGE - 1

      const executeProfilesQuery = async (baseQuery: any) => {
        if (supportsShowInUsers === false) {
          return await baseQuery
        }
        const withVisibility = baseQuery.or('show_in_users.is.null,show_in_users.eq.true')
        const firstTry = await withVisibility
        if (!firstTry.error) {
          if (supportsShowInUsers !== true) setSupportsShowInUsers(true)
          return firstTry
        }
        const errorCode = (firstTry.error as { code?: string } | null)?.code
        const errorMessage = (firstTry.error as { message?: string } | null)?.message || ''
        if (errorCode === '42703' || errorMessage.includes('show_in_users')) {
          setSupportsShowInUsers(false)
          return await baseQuery
        }
        return firstTry
      }

      const shouldFilterBySubcategory =
        selectedSubcategory !== 'all' && supportsDisplaySubcategories !== false

      const applyClientFilters = (profiles: User[]) => {
        return profiles.filter((profile) => {
          if (selectedStatus !== 'all') {
            const profileTypes = parseProfileTypes(profile.profile_type)
            if (!profileTypes.includes(selectedStatus)) return false
          }
          if (selectedSubcategory !== 'all' && supportsDisplaySubcategories === false) {
            return true
          }
          if (selectedSubcategory !== 'all') {
            const subcategories = parseTextArray(profile.display_subcategories)
            if (!subcategories.includes(selectedSubcategory)) return false
          }
          return true
        })
      }

      const selectColumns = supportsDisplaySubcategories === false
        ? 'id, username, full_name, avatar_url, profile_type, email'
        : 'id, username, full_name, avatar_url, profile_type, display_subcategories, email'

      // Filtre "Tout" : afficher tous les utilisateurs (avec filtres avancés optionnels)
      if (!activeCategorySlug) {
        let query = supabase
          .from('profiles')
          .select(selectColumns, { count: 'exact' })
          .order('updated_at', { ascending: false })
          .range(start, end)

        if (shouldFilterBySubcategory) {
          query = query.contains('display_subcategories', [selectedSubcategory])
        }

        if (user) {
          query = query.neq('id', user.id)
        }

        query = query.neq('email', MODERATOR_EMAIL)

        let { data: profilesData, error: profilesError, count } = await executeProfilesQuery(query)
        const missingSubcatColumn =
          String((profilesError as { message?: string } | null)?.message || '').includes('display_subcategories')
        if (profilesError && missingSubcatColumn && supportsDisplaySubcategories !== false) {
          setSupportsDisplaySubcategories(false)
          let retryQuery = supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, profile_type, email', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(start, end)
          if (user) retryQuery = retryQuery.neq('id', user.id)
          retryQuery = retryQuery.neq('email', MODERATOR_EMAIL)
          const retry = await executeProfilesQuery(retryQuery)
          profilesData = retry.data
          profilesError = retry.error
          count = retry.count
        }

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          setLoading(false)
          setLoadingMore(false)
          return
        }

        const fetchedUsers = applyClientFilters((profilesData || []) as User[])
        const visibleUsers = fetchedUsers.filter((profile) => !isModeratorEmail(profile.email))

        if (pageNum === 0) {
          setUsers(visibleUsers)
        } else {
          setUsers(prev => [...prev, ...visibleUsers])
        }
        fetchFollowingStatus(visibleUsers.map((item) => item.id))

        if (typeof count === 'number') {
          setHasMore(count > end + 1)
        } else {
          setHasMore(visibleUsers.length === USERS_PER_PAGE)
        }
        return
      }

      let query = supabase
        .from('profiles')
        .select(selectColumns, { count: 'exact' })
        .contains('display_categories', [activeCategorySlug])
        .order('updated_at', { ascending: false })
        .range(start, end)

      if (shouldFilterBySubcategory) {
        query = query.contains('display_subcategories', [selectedSubcategory])
      }

      if (user) {
        query = query.neq('id', user.id)
      }

      query = query.neq('email', MODERATOR_EMAIL)

      let { data: profilesData, error: profilesError, count } = await executeProfilesQuery(query)
      const missingSubcatColumn =
        String((profilesError as { message?: string } | null)?.message || '').includes('display_subcategories')
      if (profilesError && missingSubcatColumn && supportsDisplaySubcategories !== false) {
        setSupportsDisplaySubcategories(false)
        let retryQuery = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, profile_type, email', { count: 'exact' })
          .contains('display_categories', [activeCategorySlug])
          .order('updated_at', { ascending: false })
          .range(start, end)
        if (user) retryQuery = retryQuery.neq('id', user.id)
        retryQuery = retryQuery.neq('email', MODERATOR_EMAIL)
        const retry = await executeProfilesQuery(retryQuery)
        profilesData = retry.data
        profilesError = retry.error
        count = retry.count
      }

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      const fetchedUsers = applyClientFilters((profilesData || []) as User[])
      const visibleUsers = fetchedUsers.filter((profile) => !isModeratorEmail(profile.email))

      if (pageNum === 0) {
        setUsers(visibleUsers)
      } else {
        setUsers(prev => [...prev, ...visibleUsers])
      }
      fetchFollowingStatus(visibleUsers.map((item) => item.id))

      if (typeof count === 'number') {
        setHasMore(count > end + 1)
      } else {
        setHasMore(visibleUsers.length === USERS_PER_PAGE)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedStatus,
    categories,
    categoryId,
    user,
    fetchFollowingStatus,
    supportsShowInUsers,
    supportsDisplaySubcategories
  ])

  useEffect(() => {
    // Reset when category changes
    setUsers([])
    setPage(0)
    setHasMore(true)
    setFollowingMap({})
    fetchUsers(0)
  }, [selectedCategory, selectedSubcategory, selectedStatus, categoryId, fetchUsers])

  // Initialiser selectedCategory depuis categoryId si présent
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        setSelectedCategory(category.slug)
        setPendingCategory(category.slug)
      }
    }
  }, [categoryId, categories])

  useEffect(() => {
    if (selectedCategory === 'all') {
      setSelectedSubcategory('all')
    } else if (selectedSubcategory !== 'all' && !selectedSubcategory.startsWith(`${selectedCategory}::`)) {
      setSelectedSubcategory('all')
    }
  }, [selectedCategory, selectedSubcategory])

  useEffect(() => {
    if (!showAdvancedFilters) return
    setPendingCategory(selectedCategory)
    setPendingSubcategory(selectedSubcategory)
    setPendingStatus(selectedStatus)
  }, [showAdvancedFilters, selectedCategory, selectedSubcategory, selectedStatus])

  // Infinite scroll avec Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchUsers(nextPage)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadingMore, loading, page, fetchUsers])

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    navigate(`/profile/public/${userId}`)
  }

  const handleFollowClick = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()

    if (!user) {
      navigate('/auth/login')
      return
    }

    if (followingMap[userId]) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('follows') as any)
        .insert({
          follower_id: user.id,
          following_id: userId
        })

      if (error) {
        console.error('Error following user:', error)
        return
      }

      setFollowingMap((prev) => ({ ...prev, [userId]: true }))
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const openAdvancedFilters = () => {
    setPendingCategory(selectedCategory)
    setPendingSubcategory(selectedSubcategory)
    setPendingStatus(selectedStatus)
    setShowAdvancedFilters(true)
  }

  const applyAdvancedFilters = () => {
    setSelectedCategory(pendingCategory)
    setSelectedSubcategory(
      pendingCategory === 'all' || !pendingSubcategory.startsWith(`${pendingCategory}::`)
        ? 'all'
        : pendingSubcategory
    )
    setSelectedStatus(pendingStatus)
    setShowAdvancedFilters(false)
  }

  const resetAdvancedFilters = () => {
    setPendingCategory('all')
    setPendingSubcategory('all')
    setPendingStatus('all')
  }

  return (
    <div className="users-page">
      {/* Header fixe */}
      <div className="users-header-fixed">
        <div className="users-header-content">
          <BackButton className="users-back-button" />
          <h1 className="users-title">Utilisateurs</h1>
          <button
            type="button"
            className={`users-header-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={openAdvancedFilters}
            aria-label="Filtrer les utilisateurs"
            title="Filtrer"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && <span className="users-header-filter-count">{activeFilterCount}</span>}
          </button>
        </div>
        
        {/* Menu de filtres */}
        <div className="users-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`users-filter-btn ${selectedCategory === filter.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(filter.id)
                setSelectedSubcategory('all')
                setUsers([])
                setPage(0)
                setHasMore(true)
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone scrollable */}
      <PullToRefresh onRefresh={() => fetchUsers(0)} className="users-scrollable" enabled={isMobile}>
        {loading && users.length === 0 ? (
          <div className="users-loading">
            <p>Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            type="profiles"
            customTitle="Ta vision mérite une équipe."
            customSubtext="Trouve des profils motivés pour lancer ton prochain projet."
            actionLabel="Publier une annonce"
            onAction={() => navigate('/publish')}
            marketing
            marketingTone="teal"
          />
        ) : (
          <div className="users-masonry">
            {users.map((userItem) => {
              const displayName = userItem.full_name?.trim() || 'Utilisateur'

              const profileTypes = parseProfileTypes(userItem.profile_type)
                .filter(type => type !== 'other')
              const displayProfileTypes = profileTypes
                .map(type => profileTypeLabelMap[type as keyof typeof profileTypeLabelMap] || type)
                .slice(0, 2)

              return (
                <div 
                  key={userItem.id} 
                  className="users-card"
                  onClick={(e) => handleProfileClick(e, userItem.id)}
                >
                  {/* Photo de l'utilisateur */}
                  <div className="users-card-avatar-wrapper">
                    {userItem.avatar_url ? (
                      <img 
                        src={userItem.avatar_url} 
                        alt={displayName}
                        className="users-card-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                        }}
                      />
                    ) : (
                      <div className="users-card-avatar-placeholder">
                        {(displayName[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Nom de l'utilisateur */}
                  <div className="users-card-name">{displayName}</div>
                  {displayProfileTypes.map((typeLabel, index) => (
                    <div key={`${typeLabel}-${index}`} className="users-card-type">{typeLabel}</div>
                  ))}
                  
                  {/* Bouton Plus pour suivre */}
                  {followingMap[userItem.id] ? (
                    <button
                      className="users-card-followed-btn"
                      onClick={(e) => e.stopPropagation()}
                      title="Créateur déjà suivi"
                      aria-label="Créateur déjà suivi"
                      disabled
                    >
                      <Check size={18} />
                    </button>
                  ) : (
                    <button
                      className="users-card-plus-btn"
                      onClick={(e) => handleFollowClick(e, userItem.id)}
                      title="Suivre le créateur"
                      aria-label="Suivre le créateur"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Observer pour infinite scroll */}
        {hasMore && (
          <div ref={observerTarget} className="users-observer-target">
            {loadingMore && <div className="users-loading-more">Chargement...</div>}
          </div>
        )}
      </PullToRefresh>

      {showAdvancedFilters && typeof document !== 'undefined' && createPortal(
        <div className="users-filter-modal-overlay" onClick={() => setShowAdvancedFilters(false)}>
          <div className="users-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-filter-modal-header">
              <h2>Filtrer</h2>
              <button
                type="button"
                className="users-filter-modal-close"
                onClick={() => setShowAdvancedFilters(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="users-filter-modal-section">
              <p className="users-filter-modal-title">Catégorie</p>
              <div className="users-filter-modal-options">
                {filters.map((filter) => (
                  <button
                    key={`modal-category-${filter.id}`}
                    type="button"
                    className={`users-filter-modal-option ${pendingCategory === filter.id ? 'active' : ''}`}
                    onClick={() => {
                      setPendingCategory(filter.id)
                      if (filter.id === 'all') {
                        setPendingSubcategory('all')
                        return
                      }
                      if (pendingSubcategory !== 'all' && !pendingSubcategory.startsWith(`${filter.id}::`)) {
                        setPendingSubcategory('all')
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="users-filter-modal-section">
              <p className="users-filter-modal-title">Sous-catégorie</p>
              <div className="users-filter-modal-options">
                <button
                  type="button"
                  className={`users-filter-modal-option ${pendingSubcategory === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingSubcategory('all')}
                >
                  Toutes
                </button>
                {pendingCategory !== 'all' ? (
                  subcategoryFilterOptions.length > 0 ? (
                    subcategoryFilterOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`users-filter-modal-option ${pendingSubcategory === option.id ? 'active' : ''}`}
                        onClick={() => setPendingSubcategory(option.id)}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <div className="users-filter-modal-empty">Aucune sous-catégorie</div>
                  )
                ) : (
                  <div className="users-filter-modal-empty">Choisissez d’abord une catégorie</div>
                )}
              </div>
            </div>

            <div className="users-filter-modal-section">
              <p className="users-filter-modal-title">Statut</p>
              <div className="users-filter-modal-options">
                <button
                  type="button"
                  className={`users-filter-modal-option ${pendingStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingStatus('all')}
                >
                  Tous
                </button>
                {PROFILE_TYPE_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`users-filter-modal-option ${pendingStatus === option.id ? 'active' : ''}`}
                    onClick={() => setPendingStatus(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="users-filter-modal-actions">
              <button type="button" className="users-filter-modal-reset" onClick={resetAdvancedFilters}>
                Réinitialiser
              </button>
              <button type="button" className="users-filter-modal-apply" onClick={applyAdvancedFilters}>
                Appliquer le filtrage
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default UsersPage
