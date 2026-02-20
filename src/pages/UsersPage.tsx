import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import './UsersPage.css'

interface User {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  profile_type?: string | null
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
  'projets-equipe',
  'services',
  'evenements',
  'suivi',
  'vente',
  'poste-service'
]

const MODERATOR_EMAIL = 'binta22116@gmail.com'

const isModeratorEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === MODERATOR_EMAIL

const UsersPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { t } = useTranslation(['categories'])
  const categoryId = searchParams.get('category')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
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

      // Filtre "Tout" : afficher tous les utilisateurs
      if (!activeCategorySlug) {
        let query = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, profile_type, email', { count: 'exact' })
          .order('updated_at', { ascending: false })
          .range(start, end)

        if (user) {
          query = query.neq('id', user.id)
        }

        query = query.neq('email', MODERATOR_EMAIL)
        query = query.or('show_in_users.is.null,show_in_users.eq.true')

        const { data: profilesData, error: profilesError, count } = await query

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          setLoading(false)
          setLoadingMore(false)
          return
        }

        const fetchedUsers = (profilesData || []) as User[]
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
        .select('id, username, full_name, avatar_url, profile_type, email', { count: 'exact' })
        .contains('display_categories', [activeCategorySlug])
        .order('updated_at', { ascending: false })
        .range(start, end)

      if (user) {
        query = query.neq('id', user.id)
      }

      query = query.neq('email', MODERATOR_EMAIL)
      query = query.or('show_in_users.is.null,show_in_users.eq.true')

      const { data: profilesData, error: profilesError, count } = await query

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      const fetchedUsers = (profilesData || []) as User[]
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
  }, [selectedCategory, categories, categoryId, user, fetchFollowingStatus])

  useEffect(() => {
    // Reset when category changes
    setUsers([])
    setPage(0)
    setHasMore(true)
    setFollowingMap({})
    fetchUsers(0)
  }, [selectedCategory, categoryId, fetchUsers])

  // Initialiser selectedCategory depuis categoryId si présent
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        setSelectedCategory(category.slug)
      }
    }
  }, [categoryId, categories])

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

  return (
    <div className="users-page">
      {/* Header fixe */}
      <div className="users-header-fixed">
        <div className="users-header-content">
          <BackButton className="users-back-button" />
          <h1 className="users-title">Utilisateurs</h1>
          <div className="users-header-spacer"></div>
        </div>
        
        {/* Menu de filtres */}
        <div className="users-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`users-filter-btn ${selectedCategory === filter.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(filter.id)
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
      <div className="users-scrollable">
        {loading && users.length === 0 ? (
          <div className="users-loading">
            <p>Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            <p>Aucun utilisateur disponible</p>
            {user && (
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                {categoryId
                  ? 'Aucun utilisateur dans cette catégorie'
                  : 'Essayez de changer de catégorie ou vérifiez vos filtres'}
              </p>
            )}
            <button onClick={() => navigate('/home')} className="users-btn-primary">
              Retour à l'accueil
            </button>
          </div>
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
      </div>
    </div>
  )
}

export default UsersPage
