import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { LocationAutocomplete } from '../components/Location/LocationAutocomplete'
import './Search.css'
import './SwipePage.css'

interface Post {
  id: string
  user_id: string
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

const Search = () => {
  const { user } = useAuth()
  const [selectedFilter, _setSelectedFilter] = useState('all')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFilter, setDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [pendingSortOrder, setPendingSortOrder] = useState<'desc' | 'asc'>('desc')
  const [pendingDateFilter, setPendingDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { t } = useTranslation(['categories'])

  // (category order removed — not used with location-only search)

  // (filters removed — search page now uses location-only input)

  useEffect(() => {
    fetchCategories()
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

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
    if (!query.trim() && !locationCoords) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      let categoryId: string | undefined
      if (selectedFilter !== 'all') {
        const category = categories.find(c => c.slug === selectedFilter)
        if (category) categoryId = category.id
      }

      const fieldsToSelect = [
        'id',
        'title',
        'description',
        'price',
        'location',
        'location_lat',
        'location_lng',
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

      const { data: posts, error: postsError } = await postsQuery

      if (postsError || !posts) {
        console.error('Error searching posts:', postsError)
        setResults([])
        setLoading(false)
        return
      }

      let filteredPosts = posts as Post[]
      if (user?.id) {
        filteredPosts = filteredPosts.filter((post) => post.user_id !== user.id)
      }
      if (locationCoords) {
        filteredPosts = filteredPosts.filter((post) => {
          if (!post.location_lat || !post.location_lng) return false
          const distance = calculateDistance(
            locationCoords.lat,
            locationCoords.lng,
            post.location_lat,
            post.location_lng
          )
          return distance <= 50
        })
      }

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
      if (locationFilter && locationFilter.trim().length > 0) {
        searchPosts(locationFilter)
      } else {
        setResults([])
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, selectedFilter, locationCoords])

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
      return matchesDate
    })

    return filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [results, dateFilter, sortOrder])

  const handleLocationSelect = (location: {
    address: string
    lat: number
    lng: number
    city?: string
  }) => {
    setLocationFilter(location.address)
    setLocationCoords({ lat: location.lat, lng: location.lng })
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

          <div className="search-location-autocomplete-wrapper" style={{ flex: 1 }}>
            <LocationAutocomplete
              value={locationFilter}
              onChange={setLocationFilter}
              onLocationSelect={handleLocationSelect}
              placeholder={t('search:locationPlaceholder') || 'Rechercher une adresse (ex: Paris, France)'}
            />
          </div>
          <button
            type="button"
            className="swipe-filter-toggle"
            onClick={() => {
              setPendingSortOrder(sortOrder)
              setPendingDateFilter(dateFilter)
              setIsFilterOpen(true)
            }}
            aria-label="Filtrer"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="search-content">
        {loading ? (
          <div className="search-loading">
            <p>{t('search:searching')}</p>
          </div>
        ) : (locationFilter.trim().length > 0) ? (
          <>
            <div className="search-results-header">
              <p className="search-results-count">
                {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} pour "{locationFilter}"
              </p>
            </div>

            {filteredResults.length > 0 ? (
              <div className="search-results-list">
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
                <p>Aucun résultat trouvé pour "{locationFilter}"</p>
              </div>
            )}
          </>
        ) : (
          <div className="search-empty-state">
              <div className="search-empty-icon">
                <SearchIcon size={36} />
              </div>
              <h2 className="search-empty-title">{t('search:emptyTitle')}</h2>
              <p className="search-empty-text">Saisissez un lieu pour commencer</p>
          </div>
        )}
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

export default Search
