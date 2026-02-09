import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon, X, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { LocationAutocomplete } from '../components/Location/LocationAutocomplete'
import { publicationTypes } from '../constants/publishData'
import { filterPaymentOptionsByCategory } from '../utils/paymentOptions'
import './Search.css'
import './SwipePage.css'

interface Post {
  id: string
  user_id?: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  location_lat?: number | null
  location_lng?: number | null
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

interface Category {
  id: string
  name: string
  slug: string
}

interface SubCategory {
  id?: string
  name: string
  slug: string
}

const Search = () => {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubCategory, setSelectedSubCategory] = useState('all')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFilter, setDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [pendingSortOrder, setPendingSortOrder] = useState<'desc' | 'asc'>('desc')
  const [pendingDateFilter, setPendingDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [pendingListingTypeFilter, setPendingListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [pendingPaymentTypeFilter, setPendingPaymentTypeFilter] = useState<string>('all')
  const [pendingCategory, setPendingCategory] = useState('all')
  const [pendingSubCategory, setPendingSubCategory] = useState('all')
  const [pendingSubCategories, setPendingSubCategories] = useState<SubCategory[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState(false)
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<Array<{ label: string; lat?: number; lng?: number }>>([])
  const [radiusKm, setRadiusKm] = useState<number>(50)
  const { t } = useTranslation(['categories'])

  const categoryOrder = useMemo(() => [
    'creation-contenu',
    'casting-role',
    'emploi',
    'studio-lieu',
    'projets-equipe',
    'services',
    'vente',
    'poste-service'
  ], [])

  const filters = useMemo(() => {
    const list = publicationTypes
      .filter((cat) => categoryOrder.includes(cat.slug))
      .sort((a, b) => categoryOrder.indexOf(a.slug) - categoryOrder.indexOf(b.slug))
      .map((cat) => ({
        id: cat.slug,
        label: t(`categories:titles.${cat.slug}`, { defaultValue: cat.name })
      }))
    return [
      { id: 'all', label: t('categories:submenus.tout') },
      ...list
    ]
  }, [categoryOrder, t])

  const selectedCategoryLabel = useMemo(() => {
    return filters.find((filter) => filter.id === selectedCategory)?.label ?? 'Toutes les catégories'
  }, [filters, selectedCategory])

  const selectedSubCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all' || selectedSubCategory === 'all') return null
    return subCategories.find((sub) => sub.slug === selectedSubCategory)?.name ?? null
  }, [selectedCategory, selectedSubCategory, subCategories])

  const categoryMenuLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'Toutes les catégories'
    if (selectedSubCategoryLabel) return selectedSubCategoryLabel
    return selectedCategoryLabel
  }, [selectedCategory, selectedSubCategoryLabel, selectedCategoryLabel])

  const sortSubCategories = useCallback((items: SubCategory[]) => {
    return [...items].sort((a, b) => {
      const aIsOther = (a.slug || '').toLowerCase() === 'autre' || (a.name || '').toLowerCase() === 'autre'
      const bIsOther = (b.slug || '').toLowerCase() === 'autre' || (b.name || '').toLowerCase() === 'autre'
      if (aIsOther && !bIsOther) return 1
      if (!aIsOther && bIsOther) return -1
      return a.name.localeCompare(b.name)
    })
  }, [])

  const pendingPaymentOptions = useMemo(() => {
    return filterPaymentOptionsByCategory(pendingCategory === 'all' ? null : pendingCategory)
  }, [pendingCategory])

  useEffect(() => {
    fetchCategories()
  }, [])

  const loadSubCategories = useCallback(async (categorySlug: string) => {
    if (categorySlug === 'all') {
      return []
    }

    const category = categories.find((item) => item.slug === categorySlug)
    if (!category) {
      const fallbackCategory = publicationTypes.find((item) => item.slug === categorySlug)
      const fallbackSubs = (fallbackCategory?.subcategories || [])
        .filter((sub) => sub.slug !== 'tout')
        .map((sub) => ({ name: sub.name, slug: sub.slug }))
      return sortSubCategories(fallbackSubs)
    }

    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('id, name, slug')
        .eq('category_id', category.id)
        .order('name')

      if (error) {
        console.error('Error fetching sub categories:', error)
        const fallbackCategory = publicationTypes.find((item) => item.slug === categorySlug)
        const fallbackSubs = (fallbackCategory?.subcategories || [])
          .filter((sub) => sub.slug !== 'tout')
          .map((sub) => ({ name: sub.name, slug: sub.slug }))
        return sortSubCategories(fallbackSubs)
      }

      const rows = (data || []) as SubCategory[]
      if (rows.length === 0) {
        const fallbackCategory = publicationTypes.find((item) => item.slug === categorySlug)
        const fallbackSubs = (fallbackCategory?.subcategories || [])
          .filter((sub) => sub.slug !== 'tout')
          .map((sub) => ({ name: sub.name, slug: sub.slug }))
        return sortSubCategories(fallbackSubs)
      }

      return sortSubCategories(rows)
    } catch (error) {
      console.error('Error fetching sub categories:', error)
      const fallbackCategory = publicationTypes.find((item) => item.slug === categorySlug)
      const fallbackSubs = (fallbackCategory?.subcategories || [])
        .filter((sub) => sub.slug !== 'tout')
        .map((sub) => ({ name: sub.name, slug: sub.slug }))
      return sortSubCategories(fallbackSubs)
    }
  }, [categories, sortSubCategories])

  useEffect(() => {
    let isMounted = true
    const fetchSubcategories = async () => {
      if (selectedCategory === 'all') {
        setSubCategories([])
        return
      }
      const list = await loadSubCategories(selectedCategory)
      if (isMounted) {
        setSubCategories(sortSubCategories(list))
      }
    }
    fetchSubcategories()
    return () => {
      isMounted = false
    }
  }, [selectedCategory, loadSubCategories, sortSubCategories])

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

  const searchPosts = async (query: string) => {
    setLoading(true)

    try {
      let categoryId: string | undefined
      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.slug === selectedCategory)
        if (category) categoryId = category.id
      }

      let subCategoryId: string | undefined
      if (selectedSubCategory !== 'all' && subCategories.length > 0) {
        const subCategory = subCategories.find((item) => item.slug === selectedSubCategory)
        if (subCategory?.id) {
          subCategoryId = subCategory.id
        }
      }

      const fieldsToSelect = [
        'id',
        'listing_type',
        'payment_type',
        'title',
        'description',
        'price',
        'location',
        'images',
        'likes_count',
        'comments_count',
        'created_at',
        'needed_date',
        'number_of_people',
        'delivery_available',
        'user_id',
        'category_id'
      ].join(', ')

      let postsQuery = supabase
        .from('posts')
        .select(fieldsToSelect)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      if (query.trim()) {
        postsQuery = postsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      }

      if (categoryId) {
        postsQuery = postsQuery.eq('category_id', categoryId)
      }
      if (subCategoryId) {
        postsQuery = postsQuery.eq('sub_category_id', subCategoryId)
      }
      if (paymentTypeFilter !== 'all') {
        postsQuery = postsQuery.eq('payment_type', paymentTypeFilter)
      }

      const { data: posts, error: postsError } = await postsQuery

      if (postsError || !posts) {
        console.error('Error searching posts:', postsError)
        setResults([])
        setLoading(false)
        return
      }

      let filteredPosts = posts as Post[]
      if (user?.id) {
        filteredPosts = filteredPosts.filter((post) => !post.user_id || post.user_id !== user.id)
      }
      // Filtrage par distance désactivé tant que les colonnes lat/lng ne sont pas disponibles

      if (filteredPosts.length === 0) {
        setResults([])
        setLoading(false)
        return
      }

      const userIds = [...new Set(filteredPosts.map((p: any) => p.user_id).filter(Boolean))]
      const categoryIds = [...new Set(filteredPosts.map((p: any) => p.category_id).filter(Boolean))]

      const profilesMap = new Map()
      const categoriesMap = new Map()

      const [profilesResult, categoriesResult] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .in('id', userIds)
          : Promise.resolve({ data: null }),
        categoryIds.length > 0
          ? supabase
              .from('categories')
              .select('id, name, slug')
              .in('id', categoryIds)
          : Promise.resolve({ data: null })
      ])

      if (profilesResult.data) profilesResult.data.forEach((p: any) => profilesMap.set(p.id, p))
      if (categoriesResult.data) categoriesResult.data.forEach((c: any) => categoriesMap.set(c.id, c))

      const postsWithRelations: Post[] = filteredPosts.map((post: any) => {
        const profile = profilesMap.get(post.user_id)
        const category = categoriesMap.get(post.category_id)
        return {
          id: post.id,
          user_id: post.user_id,
          title: post.title,
          description: post.description,
          price: post.price,
          location: post.location,
          images: post.images,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          created_at: post.created_at,
          needed_date: post.needed_date,
          number_of_people: post.number_of_people,
          delivery_available: post.delivery_available || false,
          payment_type: post.payment_type || null,
          user: profile ? {
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          } : null,
          category: category ? {
            name: t(`categories:titles.${category.slug}`, { defaultValue: category.name }),
            slug: category.slug
          } : null
        }
      })

      setResults(postsWithRelations)
    } catch (error) {
      console.error('Error searching posts:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Debounce pour recherches de localisation
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery.trim().length > 0) {
        searchPosts(searchQuery)
      } else {
        searchPosts('')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedSubCategory, locationCoords, paymentTypeFilter])

  const filteredResults = useMemo(() => {
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

    const filtered = results.filter((post) => {
      const createdAt = new Date(post.created_at).getTime()
      const matchesDate = dateLimitMs ? createdAt >= now - dateLimitMs : true
      const matchesListingType =
        listingTypeFilter === 'all' || post.listing_type === listingTypeFilter
      return matchesDate && matchesListingType
    })

    return filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [results, dateFilter, sortOrder, listingTypeFilter])

  const handleLocationSelect = (location: {
    address: string
    lat: number
    lng: number
    city?: string
  }) => {
    setLocationFilter(location.address)
    setLocationCoords({ lat: location.lat, lng: location.lng })
    setSelectedLocations((prev) => {
      if (prev.some((item) => item.label === location.address)) return prev
      return [...prev, { label: location.address, lat: location.lat, lng: location.lng }]
    })
  }

  const handleRemoveLocation = (label: string) => {
    setSelectedLocations((prev) => prev.filter((item) => item.label !== label))
  }

  const handleClearLocations = () => {
    setSelectedLocations([])
    setLocationFilter('')
    setLocationCoords(null)
  }

  const handleLike = () => {
    // Le PostCard gère déjà les likes
  }

  return (
    <div className="search-page-container">
      {/* Header */}
      <div className="search-header">
        <div className="search-header-content">
          <BackButton className="search-back-button" />

          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <SearchIcon className="search-input-icon" size={16} />
            <input
              className="search-input"
              type="text"
              placeholder="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="search-filter-menu-container">
          <div className="search-filter-menu">
          <button
            type="button"
            className="search-filter-menu-btn"
            onClick={() => {
              setPendingSortOrder(sortOrder)
              setPendingDateFilter(dateFilter)
              setPendingListingTypeFilter(listingTypeFilter)
              setPendingCategory(selectedCategory)
              setPendingSubCategory(selectedSubCategory)
              setPendingSubCategories(subCategories)
              setPendingPaymentTypeFilter(paymentTypeFilter)
              setIsFilterOpen(true)
            }}
          >
            Filtres
          </button>
          <button
            type="button"
            className="search-filter-menu-btn"
            onClick={() => {
              setPendingCategory(selectedCategory)
              setPendingSubCategory(selectedSubCategory)
              setPendingSubCategories(subCategories)
              setIsCategoryPanelOpen(true)
            }}
          >
            {categoryMenuLabel}
          </button>
          <button
            type="button"
            className="search-filter-menu-btn"
            onClick={() => setIsLocationPanelOpen((prev) => !prev)}
          >
            Lieu
          </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="search-content">
        {loading ? (
          <div className="search-loading">
            <p>{t('search:searching')}</p>
          </div>
        ) : (searchQuery.trim().length > 0 || results.length > 0) ? (
          <>
            <div className="search-results-header">
              <p className="search-results-count">
                {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}{searchQuery.trim().length > 0 ? ` pour "${searchQuery}"` : ''}
              </p>
            </div>

            {filteredResults.length > 0 ? (
              <div className="search-results-list posts-list">
                {filteredResults.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    viewMode="list"
                    onLike={handleLike}
                  />
                ))}
              </div>
            ) : (
              <div className="search-empty-state">
                <p>Aucun résultat trouvé{searchQuery.trim().length > 0 ? ` pour "${searchQuery}"` : ''}</p>
              </div>
            )}
          </>
        ) : (
          <div className="search-empty-state">
              <div className="search-empty-icon">
                <SearchIcon size={36} />
              </div>
              <h2 className="search-empty-title">{t('search:emptyTitle')}</h2>
              <p className="search-empty-text">Saisissez un mot pour commencer</p>
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div
          className="search-location-overlay"
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className="search-location-sheet search-location-sheet--tall"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="search-location-panel-header">
              <h3>Filtres</h3>
              <button
                type="button"
                className="search-location-panel-close"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="search-location-divider" />
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Catégorie</p>
              <button
                type="button"
                className="search-filter-category-link"
                onClick={() => {
                  setIsFilterOpen(false)
                  setPendingCategory(selectedCategory)
                  setPendingSubCategory(selectedSubCategory)
                  setPendingSubCategories(subCategories)
                  setIsCategoryPanelOpen(true)
                }}
              >
                {categoryMenuLabel}
              </button>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Type d'annonce</p>
              <div className="swipe-filter-options swipe-filter-options-list">
                <button
                  type="button"
                  className={`swipe-filter-option swipe-filter-option--plain ${pendingListingTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('all')}
                >
                  {pendingListingTypeFilter === 'all' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  Toutes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option swipe-filter-option--plain ${pendingListingTypeFilter === 'offer' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('offer')}
                >
                  {pendingListingTypeFilter === 'offer' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  Offre
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option swipe-filter-option--plain ${pendingListingTypeFilter === 'request' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('request')}
                >
                  {pendingListingTypeFilter === 'request' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  Demande
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
                {pendingPaymentOptions.map((option) => (
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
              <p className="swipe-filter-section-title">Ordre</p>
              <div className="swipe-filter-options swipe-filter-options-list">
                <button
                  type="button"
                  className={`swipe-filter-option swipe-filter-option--plain ${pendingSortOrder === 'desc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('desc')}
                >
                  {pendingSortOrder === 'desc' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  Plus récentes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option swipe-filter-option--plain ${pendingSortOrder === 'asc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('asc')}
                >
                  {pendingSortOrder === 'asc' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
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
            <div className="search-location-actions">
              <button
                type="button"
                className="search-location-action secondary"
                onClick={() => setIsFilterOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="search-location-action primary"
                onClick={() => {
                  setSortOrder(pendingSortOrder)
                  setDateFilter(pendingDateFilter)
                  setListingTypeFilter(pendingListingTypeFilter)
                  setSelectedCategory(pendingCategory)
                  setSelectedSubCategory(pendingSubCategory)
                  setSubCategories(pendingSubCategories)
                  setPaymentTypeFilter(pendingPaymentTypeFilter)
                  setIsFilterOpen(false)
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
      {isCategoryPanelOpen && (
        <div
          className="search-location-overlay"
          onClick={() => setIsCategoryPanelOpen(false)}
        >
          <div
            className="search-location-sheet search-location-sheet--tall"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="search-location-panel-header">
              <h3>Catégories</h3>
              <button
                type="button"
                className="search-location-panel-close"
                onClick={() => setIsCategoryPanelOpen(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="search-location-divider" />
            <div className="swipe-filter-section">
              <div className="swipe-filter-options swipe-filter-options-list">
                {filters.map((filter) => {
                  const cat = publicationTypes.find((c) => c.slug === filter.id)
                  const Icon = cat?.icon
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      className={`category-list-item ${pendingCategory === filter.id ? 'active' : ''}`}
                      onClick={async () => {
                        setPendingCategory(filter.id)
                        setPendingSubCategory('all')
                        const nextSubCategories = filter.id === 'all'
                          ? []
                          : await loadSubCategories(filter.id)
                        setPendingSubCategories(nextSubCategories)
                      }}
                    >
                      <span className="category-list-icon">
                        {Icon ? <Icon size={18} /> : <Circle size={16} />}
                      </span>
                      <span className="category-list-label">{filter.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {pendingCategory !== 'all' && (
              <div className="swipe-filter-section">
                <p className="swipe-filter-section-title">Sous-catégories</p>
                {pendingSubCategories.length === 0 ? (
                  <p className="swipe-filter-empty">Aucune sous-catégorie</p>
                ) : (
                  <div className="swipe-filter-options swipe-filter-options-list">
                    <button
                      type="button"
                      className={`subcategory-list-item ${pendingSubCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setPendingSubCategory('all')}
                    >
                      <span className="subcategory-list-label">Tout</span>
                    </button>
                    {pendingSubCategories.map((sub) => (
                      <button
                        key={sub.slug}
                        type="button"
                        className={`subcategory-list-item ${pendingSubCategory === sub.slug ? 'active' : ''}`}
                        onClick={() => setPendingSubCategory(sub.slug)}
                      >
                        <span className="subcategory-list-label">{sub.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="search-location-actions">
              <button
                type="button"
                className="search-location-action secondary"
                onClick={() => setIsCategoryPanelOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="search-location-action primary"
                onClick={() => {
                  setSelectedCategory(pendingCategory)
                  setSelectedSubCategory(pendingSubCategory)
                  setSubCategories(pendingSubCategories)
                  setIsCategoryPanelOpen(false)
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
      {isLocationPanelOpen && (
        <div
          className="search-location-overlay"
          onClick={() => setIsLocationPanelOpen(false)}
        >
          <div
            className="search-location-sheet search-location-sheet--tall"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="search-location-panel-header">
              <h3>Où cherchez-vous ?</h3>
              <button
                type="button"
                className="search-location-panel-close"
                onClick={() => setIsLocationPanelOpen(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="search-location-divider" />
            <div className="search-location-panel-input">
              <LocationAutocomplete
                value={locationFilter}
                onChange={setLocationFilter}
                onLocationSelect={handleLocationSelect}
                placeholder={t('search:locationPlaceholder') || 'Rechercher un lieu'}
              />
            </div>
            <div className="search-location-suggestion">
              <button
                type="button"
                className="search-location-action"
              >
                Autour de moi
              </button>
            </div>
            {selectedLocations.length > 0 && (
              <div className="search-location-selected">
                {selectedLocations.map((item) => (
                  <div key={item.label} className="search-location-chip">
                    <span>{item.label}</span>
                    <button
                      type="button"
                      className="search-location-chip-remove"
                      onClick={() => handleRemoveLocation(item.label)}
                      aria-label="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="search-location-radius">
              <p>Dans un rayon de</p>
              <div className="search-location-radius-slider">
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(Number(event.target.value))}
                  aria-label="Rayon en kilomètres"
                />
                <div className="search-location-radius-range">
                  <span>0 km</span>
                  <span>{radiusKm} km</span>
                  <span>200 km</span>
                </div>
              </div>
            </div>
            <div className="search-location-actions">
              <button
                type="button"
                className="search-location-action secondary"
                onClick={handleClearLocations}
              >
                Effacer
              </button>
              <button
                type="button"
                className="search-location-action primary"
                onClick={() => setIsLocationPanelOpen(false)}
              >
                Valider la localisation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
