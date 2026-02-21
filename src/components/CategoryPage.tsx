import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Users, ChevronDown, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import { PostCardSkeleton } from './PostCardSkeleton'
import BackButton from './BackButton'
import { EmptyState } from './EmptyState'
import { fetchSubMenusForCategory } from '../utils/categoryHelpers'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { useAuth } from '../hooks/useSupabase'
import { filterPaymentOptionsByCategory } from '../utils/paymentOptions'
import { 
  getSubSubCategories, 
  hasSubSubCategories,
  getSubSubSubCategories,
  hasSubSubSubCategories
} from '../utils/subSubCategories'
import '../pages/SwipePage.css'
import './CategoryPage.css'

interface Post {
  id: string
  user_id?: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  images?: string[] | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  listing_type?: string | null
  payment_type?: string | null
  user?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  category?: {
    name: string
    slug: string
  } | null
}

interface CategoryPageProps {
  categorySlug: string
  categoryName: string
}

const CategoryPage = ({ categorySlug, categoryName }: CategoryPageProps) => {
  const { t } = useTranslation(['categories'])
  const { submenu, subSubMenu, subSubSubMenu } = useParams<{ 
    submenu?: string
    subSubMenu?: string
    subSubSubMenu?: string
  }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFilter, setDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [pendingSortOrder, setPendingSortOrder] = useState<'desc' | 'asc'>('desc')
  const [pendingDateFilter, setPendingDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [pendingListingTypeFilter, setPendingListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [pendingPaymentTypeFilter, setPendingPaymentTypeFilter] = useState<string>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [subMenus, setSubMenus] = useState<Array<{ name: string; slug: string }>>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openNestedDropdown, setOpenNestedDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [nestedDropdownPosition, setNestedDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const nestedDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const getSubMenuLabel = (slug: string, fallback: string) => {
    return t(`categories:submenus.${slug}`, { defaultValue: fallback })
  }

  const paymentOptions = useMemo(
    () => filterPaymentOptionsByCategory(categorySlug),
    [categorySlug]
  )

  useEffect(() => {
    fetchSubMenus()
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submenu, subSubMenu, subSubSubMenu, categorySlug, user?.id])

  // Fermer les dropdowns si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Vérifier si le clic est en dehors du menu N3
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown]
        const menuElement = document.querySelector('.category-dropdown-menu')
        if (dropdownElement && !dropdownElement.contains(target) && 
            menuElement && !menuElement.contains(target)) {
          setOpenDropdown(null)
          setOpenNestedDropdown(null)
          setDropdownPosition(null)
          setNestedDropdownPosition(null)
        }
      }
      
      // Vérifier si le clic est en dehors du menu N4
      if (openNestedDropdown) {
        const nestedElement = nestedDropdownRefs.current[openNestedDropdown]
        const nestedMenuElement = document.querySelector('.category-nested-dropdown-menu')
        if (nestedElement && !nestedElement.contains(target) && 
            nestedMenuElement && !nestedMenuElement.contains(target)) {
          setOpenNestedDropdown(null)
          setNestedDropdownPosition(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown, openNestedDropdown])

  const fetchSubMenus = async () => {
    const subMenusData = await fetchSubMenusForCategory(categorySlug)
    // Ajouter "Tout" en premier
    const allSubMenus = [{ name: 'Tout', slug: 'tout' }, ...subMenusData]
    setSubMenus(allSubMenus)
  }

  const fetchPosts = async () => {
    setLoading(true)
    let categoryId: string | undefined
    let subCategoryId: string | undefined

    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()

    if (category && (category as any).id) {
      categoryId = (category as any).id
    }

    // Si "Tout" est sélectionné ou aucun sous-menu, on ne filtre pas par sous-catégorie
    if (submenu && submenu !== 'tout' && categoryId) {
      const { data: subCategory } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('slug', submenu)
        .eq('category_id', categoryId)
        .maybeSingle()

      if (subCategory && (subCategory as any).id) {
        subCategoryId = (subCategory as any).id
      }
    }

    let posts = await fetchPostsWithRelations({
      categoryId,
      subCategoryId,
      status: 'active',
      limit: 15, // Réduit de 50 à 15 pour un chargement initial plus rapide
      orderBy: 'created_at',
      orderDirection: 'desc',
      useCache: true,
      excludeUserId: user?.id
    })

    // Fallback robuste si la catégorie n'est pas trouvée en base:
    // on filtre via le slug de catégorie présent dans les relations du post.
    if (!categoryId) {
      posts = posts.filter((post) => post.category?.slug === categorySlug)
    }

    // Exclure les posts de l'utilisateur connecté (fallback si besoin)
    if (user?.id) {
      posts = posts.filter((post) => !post.user_id || post.user_id !== user.id)
    }

    // Filtrer par sous-sous-menu (N3) si présent
    if (subSubMenu) {
      posts = posts.filter((post) => {
        const titleMatch = post.title?.toLowerCase().includes(subSubMenu.toLowerCase())
        const descMatch = post.description?.toLowerCase().includes(subSubMenu.toLowerCase())
        return titleMatch || descMatch
      })
    }

    // Filtrer par sous-sous-sous-menu (N4) si présent
    if (subSubSubMenu) {
      posts = posts.filter((post) => {
        const titleMatch = post.title?.toLowerCase().includes(subSubSubMenu.toLowerCase())
        const descMatch = post.description?.toLowerCase().includes(subSubSubMenu.toLowerCase())
        return titleMatch || descMatch
      })
    }

    setPosts(posts)
    setFilteredPosts(posts)
    setLoading(false)
  }

  // Filtrer les posts (recherche + période + tri)
  useEffect(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const now = Date.now()
    const dateLimitMs = dateFilter === '1d'
      ? 24 * 60 * 60 * 1000
      : dateFilter === '2d'
        ? 2 * 24 * 60 * 60 * 1000
      : dateFilter === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : dateFilter === '2w'
            ? 14 * 24 * 60 * 60 * 1000
            : dateFilter === '3w'
              ? 21 * 24 * 60 * 60 * 1000
              : dateFilter === '1m'
                ? 30 * 24 * 60 * 60 * 1000
                : dateFilter === '2m'
                  ? 60 * 24 * 60 * 60 * 1000
                  : null

    const filtered = posts.filter((post) => {
      const matchesQuery = normalizedQuery.length === 0
        || post.title?.toLowerCase().includes(normalizedQuery)
        || post.description?.toLowerCase().includes(normalizedQuery)
        || post.location?.toLowerCase().includes(normalizedQuery)

      const createdAt = new Date(post.created_at).getTime()
      const matchesDate = dateLimitMs ? createdAt >= now - dateLimitMs : true
      const matchesOwner = user ? !post.user_id || post.user_id !== user.id : true
      const matchesListingType =
        listingTypeFilter === 'all' || post.listing_type === listingTypeFilter
      const matchesPaymentType =
        paymentTypeFilter === 'all' || post.payment_type === paymentTypeFilter

      return matchesQuery && matchesDate && matchesOwner && matchesListingType && matchesPaymentType
    })

    const sorted = filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })

    setFilteredPosts(sorted)
  }, [searchQuery, posts, dateFilter, sortOrder, listingTypeFilter, paymentTypeFilter, user])

  const handleSubCategoryClick = (subMenuSlug: string) => {
    if (subMenuSlug === 'tout') {
      navigate(`/${categorySlug}`)
      setOpenDropdown(null)
      setOpenNestedDropdown(null)
    } else {
      // Si cette sous-catégorie a des sous-sous-catégories (N3), ouvrir le menu N3 sans naviguer
      if (hasSubSubCategories(categorySlug, subMenuSlug)) {
        // Ouvrir le menu N3 mais ne pas naviguer encore
        setOpenDropdown(subMenuSlug)
        setOpenNestedDropdown(null) // Fermer N4 si ouvert
        // Ne pas naviguer, juste ouvrir le menu pour que l'utilisateur choisisse N3
      } else {
        // Sinon, filtrer directement et naviguer
        navigate(`/${categorySlug}/${subMenuSlug}`)
        setOpenDropdown(null)
        setOpenNestedDropdown(null)
      }
    }
  }

  const handleSubSubCategoryClick = (parentSubMenuSlug: string, subSubSlug: string) => {
    if (hasSubSubSubCategories(categorySlug, parentSubMenuSlug, subSubSlug)) {
      // Ouvrir le menu N4 mais ne pas naviguer encore
      setOpenNestedDropdown(`${parentSubMenuSlug}::${subSubSlug}`)
      return
    }

    // Sinon, filtrer directement et naviguer
    navigate(`/${categorySlug}/${parentSubMenuSlug}/${subSubSlug}`)
    setOpenDropdown(null)
    setOpenNestedDropdown(null)
    setDropdownPosition(null)
    setNestedDropdownPosition(null)
  }

  const handleSubSubSubCategoryClick = (
    parentSubMenuSlug: string,
    parentSubSubSlug: string,
    subSubSubSlug: string
  ) => {
    navigate(`/${categorySlug}/${parentSubMenuSlug}/${parentSubSubSlug}/${subSubSubSlug}`)
    setOpenDropdown(null)
    setOpenNestedDropdown(null)
    setDropdownPosition(null)
    setNestedDropdownPosition(null)
  }

  // Fonctions toggle supprimées car non utilisées - la logique est directement dans les onClick

  // Ouvrir automatiquement les menus si nécessaire
  useEffect(() => {
    if (submenu && submenu !== 'tout' && hasSubSubCategories(categorySlug, submenu)) {
      // Ouvrir la colonne N3 si une sous-catégorie N2 est sélectionnée
      setOpenDropdown(submenu)
      
      // Si une sous-sous-catégorie N3 est sélectionnée et a un niveau 4, ouvrir la colonne N4
      if (subSubMenu && hasSubSubSubCategories(categorySlug, submenu, subSubMenu)) {
        setOpenNestedDropdown(`${submenu}::${subSubMenu}`)
      } else {
        setOpenNestedDropdown(null)
      }
    } else {
      setOpenDropdown(null)
      setOpenNestedDropdown(null)
    }
  }, [submenu, subSubMenu, categorySlug])

  const currentSubMenu = submenu || ''
  const isAllSelected = !submenu || submenu === 'tout'

  // Grouper les posts par sections de 3 maximum
  const postsSections = useMemo(() => {
    const sections: Post[][] = []
    const POSTS_PER_SECTION = 3
    
    // Créer des sections de 3 posts maximum
    for (let i = 0; i < filteredPosts.length; i += POSTS_PER_SECTION) {
      sections.push(filteredPosts.slice(i, i + POSTS_PER_SECTION))
    }
    
    return sections
  }, [filteredPosts])

  return (
    <div className="category-page-new swipe-page">
      {/* Header fixe (même style que Swipe/Recent) */}
      <div className="swipe-header-fixed">
        <div className="swipe-header-content">
          <BackButton className="swipe-back-button" />
          <h1 className="swipe-title">{categoryName}</h1>
          <div className="category-header-actions">
            <button
              onClick={() => navigate('/users')}
              className="category-users-button"
              title={t('categories:ui.viewUsers')}
            >
              <Users size={24} className="category-users-icon" />
            </button>
          </div>
        </div>

        {/* Barre de recherche (style Recent) */}
        <div className="swipe-search-row">
          <div className="swipe-search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder={t('categories:ui.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="swipe-search-input"
            />
            <button
              type="button"
              className="swipe-filter-toggle"
            onClick={() => {
              setPendingSortOrder(sortOrder)
              setPendingDateFilter(dateFilter)
              setPendingListingTypeFilter(listingTypeFilter)
              setPendingPaymentTypeFilter(paymentTypeFilter)
              setIsFilterOpen(true)
            }}
            aria-label="Filtrer"
          >
            <SlidersHorizontal size={18} />
          </button>
          </div>
        </div>

        {/* Menu (style Swipe) */}
        <div className="swipe-filters category-filters-scroll">
          {subMenus.length === 0 && !loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              {t('categories:ui.noSubcategories')}
            </div>
          )}
          {subMenus.map((subMenu) => {
            const isRouteActive = isAllSelected
              ? subMenu.slug === 'tout'
              : currentSubMenu === subMenu.slug
            const hasSubSub = hasSubSubCategories(categorySlug, subMenu.slug)
            const isDropdownOpen = openDropdown === subMenu.slug
            const isActive = isRouteActive || isDropdownOpen
            const subSubCategories = getSubSubCategories(categorySlug, subMenu.slug)
            const subMenuLabel = getSubMenuLabel(subMenu.slug, subMenu.name)
            
            return (
              <div
                key={subMenu.slug}
                className="category-filter-wrapper"
                ref={(el) => {
                  if (el) dropdownRefs.current[subMenu.slug] = el
                }}
              >
                <button
                  className={`swipe-filter-btn category-filter-button ${isActive ? 'active' : ''} ${hasSubSub ? 'has-dropdown' : ''}`}
                  onClick={() => {
                    if (hasSubSub) {
                      // Si le bouton a des enfants N3, ouvrir/fermer le menu
                      if (isDropdownOpen && openDropdown === subMenu.slug) {
                        // Si le menu est déjà ouvert, le fermer
                        setOpenDropdown(null)
                        setOpenNestedDropdown(null)
                        setDropdownPosition(null)
                      } else {
                        // Sinon, ouvrir le menu N3 (sans naviguer encore)
                        // Calculer la position du menu de manière synchrone
                        const buttonElement = dropdownRefs.current[subMenu.slug]?.querySelector('button')
                        if (buttonElement) {
                          const rect = buttonElement.getBoundingClientRect()
                          const menuWidth = 200 // Largeur approximative du menu
                          const windowWidth = window.innerWidth
                          let left = rect.left
                          
                          // Sur mobile, s'assurer que le menu ne sorte pas de l'écran
                          if (windowWidth < 768) {
                            // Centrer ou aligner à droite si nécessaire
                            if (left + menuWidth > windowWidth - 20) {
                              left = windowWidth - menuWidth - 20
                            }
                            // S'assurer qu'il ne sorte pas à gauche
                            if (left < 20) {
                              left = 20
                            }
                          }
                          
                          setDropdownPosition({
                            top: rect.bottom + 8,
                            left: left
                          })
                        } else {
                          // Si le bouton n'est pas trouvé, utiliser une position par défaut
                          setDropdownPosition({
                            top: 200,
                            left: 20
                          })
                        }
                        setOpenDropdown(subMenu.slug)
                        setOpenNestedDropdown(null) // Fermer N4 si ouvert
                        setNestedDropdownPosition(null)
                        // Ne pas naviguer, juste ouvrir le menu pour que l'utilisateur choisisse N3
                      }
                    } else {
                      // Sinon, filtrer directement et naviguer
                      handleSubCategoryClick(subMenu.slug)
                    }
                  }}
                >
                  {subMenuLabel}
                  {hasSubSub && (
                    <ChevronDown 
                      size={16} 
                      className={`category-filter-chevron ${isDropdownOpen ? 'open' : ''}`}
                    />
                  )}
                </button>

                {/* Menu déroulant pour les sous-sous-catégories (N3) */}
                {isDropdownOpen && hasSubSub && subSubCategories.length > 0 && (
                  <div 
                    className="category-dropdown-menu"
                    style={dropdownPosition ? {
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`
                    } : {}}
                  >
                    {subSubCategories.map((subSub) => {
                      const isSubSubActive = subSubMenu === subSub.slug
                      const hasNested = hasSubSubSubCategories(categorySlug, subMenu.slug, subSub.slug)
                      const nestedKey = `${subMenu.slug}::${subSub.slug}`
                      const isNestedOpen = openNestedDropdown === nestedKey
                      const isSubSubSelected = isSubSubActive || isNestedOpen
                      const nestedCategories = getSubSubSubCategories(categorySlug, subMenu.slug, subSub.slug)
                      const subSubLabel = getSubMenuLabel(subSub.slug, subSub.name)
                      
                      return (
                        <div
                          key={subSub.id}
                          className="category-dropdown-item-wrapper"
                          ref={(el) => {
                            if (el && hasNested) nestedDropdownRefs.current[subSub.slug] = el
                          }}
                        >
                          <button
                            className={`category-dropdown-item ${isSubSubSelected ? 'active' : ''} ${hasNested ? 'has-nested' : ''}`}
                            onClick={() => {
                              if (hasNested) {
                                // Si l'élément N3 a des enfants N4, ouvrir/fermer la colonne N4
                                if (isNestedOpen && openNestedDropdown === nestedKey) {
                                  // Si le menu N4 est déjà ouvert, le fermer
                                  setOpenNestedDropdown(null)
                                  setNestedDropdownPosition(null)
                                } else {
                                  // Sinon, ouvrir le menu N4 (sans naviguer encore)
                                  // Calculer la position du menu N4
                                  const itemElement = nestedDropdownRefs.current[subSub.slug]?.querySelector('button')
                                  if (itemElement && dropdownPosition) {
                                    const rect = itemElement.getBoundingClientRect()
                                    const nestedMenuWidth = 180 // Largeur approximative du menu N4
                                    const windowWidth = window.innerWidth
                                    let left = rect.right + 4
                                    
                                    // Sur mobile, ajuster la position pour éviter de sortir de l'écran
                                    if (windowWidth < 768) {
                                      // Si le menu N4 sort à droite, l'afficher à gauche du menu N3
                                      if (left + nestedMenuWidth > windowWidth - 20) {
                                        // Afficher à gauche du menu N3
                                        left = dropdownPosition.left - nestedMenuWidth - 4
                                        // Si ça sort à gauche aussi, l'empiler en dessous
                                        if (left < 20) {
                                          left = dropdownPosition.left
                                          // Positionner en dessous du menu N3
                                          const nestedTop = rect.bottom + 4
                                          setNestedDropdownPosition({
                                            top: nestedTop,
                                            left: left
                                          })
                                          setOpenNestedDropdown(nestedKey)
                                          return
                                        }
                                      }
                                      // S'assurer qu'il ne sorte pas à gauche
                                      if (left < 20) {
                                        left = 20
                                      }
                                    }
                                    
                                    setNestedDropdownPosition({
                                      top: rect.top,
                                      left: left
                                    })
                                  }
                                  setOpenNestedDropdown(nestedKey)
                                  // Ne pas naviguer, juste ouvrir le menu pour que l'utilisateur choisisse N4
                                }
                              } else {
                                // Sinon, filtrer directement et naviguer
                                handleSubSubCategoryClick(subMenu.slug, subSub.slug)
                              }
                            }}
                          >
                            {subSubLabel}
                            {hasNested && (
                              <ChevronRight 
                                size={14} 
                                className={`category-dropdown-chevron ${isNestedOpen ? 'open' : ''}`}
                              />
                            )}
                          </button>
                          
                          {/* Menu déroulant imbriqué pour les sous-sous-sous-catégories (N4) */}
                          {isNestedOpen && hasNested && nestedCategories.length > 0 && (
                            <div 
                              className="category-nested-dropdown-menu"
                              style={nestedDropdownPosition ? {
                                position: 'fixed',
                                top: `${nestedDropdownPosition.top}px`,
                                left: `${nestedDropdownPosition.left}px`
                              } : {}}
                            >
                              {nestedCategories.map((subSubSub) => {
                                const isSubSubSubActive = subSubSubMenu === subSubSub.slug
                                const subSubSubLabel = getSubMenuLabel(subSubSub.slug, subSubSub.name)
                                return (
                                  <button
                                    key={subSubSub.id}
                                    className={`category-nested-dropdown-item ${isSubSubSubActive ? 'active' : ''}`}
                                    onClick={() =>
                                      handleSubSubSubCategoryClick(subMenu.slug, subSub.slug, subSubSub.slug)
                                    }
                                  >
                                    {subSubSubLabel}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="swipe-scrollable category-scrollable">
        <div className="category-header-spacer" aria-hidden="true" />
        <div
          key={`${submenu || 'tout'}:${subSubMenu || ''}:${subSubSubMenu || ''}`}
          className="category-content-section category-content-transition"
        >
        {loading ? (
          <div className="category-posts-section">
            <div className="category-posts-grid">
              <PostCardSkeleton viewMode="grid" count={3} />
            </div>
          </div>
        ) : postsSections.length === 0 ? (
          <EmptyState 
            type="category"
            customTitle="Un projet. Une annonce. Une rencontre."
            customSubtext="Publie en quelques minutes et trouve les bons profils."
            actionLabel="Publier une annonce"
            onAction={() => navigate('/publish')}
            marketing
            marketingTone="purple"
          />
        ) : (
          postsSections.map((sectionPosts, index) => (
            <div key={index} className="category-posts-section">
              <div className="category-posts-grid">
                {sectionPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    viewMode="grid"
                    hideCategoryBadge
                  />
                ))}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {isFilterOpen && (
        <div
          className="swipe-filter-modal-overlay"
          onClick={() => setIsFilterOpen(false)}
        >
          <div className="swipe-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-filter-modal-header">
              <h2>Filtrer</h2>
              <button
                type="button"
                className="swipe-filter-close"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Type d'annonce</p>
              <div className="swipe-filter-options">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('all')}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'offer' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('offer')}
                >
                  Demande
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'request' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('request')}
                >
                  Offre
                </button>
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Moyen de paiement</p>
              <div className="swipe-filter-options swipe-filter-options-scroll">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingPaymentTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingPaymentTypeFilter('all')}
                >
                  Tous
                </button>
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`swipe-filter-option ${pendingPaymentTypeFilter === option.id ? 'active' : ''}`}
                    onClick={() => setPendingPaymentTypeFilter(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Trier par date</p>
              <div className="swipe-filter-options">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingSortOrder === 'desc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('desc')}
                >
                  Plus récentes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingSortOrder === 'asc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('asc')}
                >
                  Plus anciennes
                </button>
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Période</p>
              <div className="swipe-filter-options swipe-filter-options-scroll">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('all')}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '1d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('1d')}
                >
                  1 jour
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2d')}
                >
                  2 jours
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '7d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('7d')}
                >
                  7 jours
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2w' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2w')}
                >
                  2 semaines
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '3w' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('3w')}
                >
                  3 semaines
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '1m' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('1m')}
                >
                  1 mois
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2m' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2m')}
                >
                  2 mois
                </button>
              </div>
            </div>
            <button
              type="button"
              className="swipe-filter-apply"
              onClick={() => {
                setSortOrder(pendingSortOrder)
                setDateFilter(pendingDateFilter)
                setListingTypeFilter(pendingListingTypeFilter)
                setPaymentTypeFilter(pendingPaymentTypeFilter)
                setIsFilterOpen(false)
              }}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryPage
