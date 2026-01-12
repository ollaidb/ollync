import { useState, useEffect, useMemo } from 'react'
import { Search as SearchIcon, SlidersHorizontal, X, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { LocationAutocomplete } from '../components/Location/LocationAutocomplete'
import './Search.css'

interface Post {
  id: string
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationFilter, setShowLocationFilter] = useState(false)

  // Ordre des nouvelles catégories (déplacé en constante pour éviter les re-créations)
  const categoryOrder = useMemo(() => [
    'creation-contenu',
    'casting-role',
    'montage',
    'projets-equipe',
    'services',
    'vente'
  ], [])

  // Générer les filtres dynamiquement depuis les catégories
  const filters = useMemo(() => {
    return [
      { id: 'all', label: 'Tout' },
      ...categories
        .filter(cat => categoryOrder.includes(cat.slug))
        .sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.slug)
          const indexB = categoryOrder.indexOf(b.slug)
          return indexA - indexB
        })
        .map(cat => ({
          id: cat.slug,
          label: cat.name
        }))
    ]
  }, [categories, categoryOrder])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Augmenter le debounce à 500ms pour réduire les requêtes inutiles
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || locationFilter) {
        searchPosts(searchQuery || '')
      } else {
        setResults([])
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFilter, locationFilter, locationCoords])

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

  // Fonction pour calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const searchPosts = async (query: string) => {
    // Si pas de requête et pas de filtre de localisation, vider les résultats
    if (!query.trim() && !locationCoords) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Trouver la catégorie si un filtre est sélectionné
      let categoryId: string | undefined
      if (selectedFilter !== 'all') {
        const category = categories.find(c => c.slug === selectedFilter)
        if (category) {
          categoryId = category.id
        }
      }

      // Rechercher dans les posts avec la requête de recherche
      // Réduire la limite initiale pour améliorer les performances
      let postsQuery = supabase
        .from('posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50) // Limite réduite pour améliorer les performances

      // Filtre par texte de recherche
      if (query.trim()) {
        postsQuery = postsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      }

      // Filtre par catégorie
      if (categoryId) {
        postsQuery = postsQuery.eq('category_id', categoryId)
      }

      const { data: posts, error: postsError } = await postsQuery

      if (postsError) {
        console.error('Error searching posts:', postsError)
        setResults([])
        setLoading(false)
        return
      }

      if (!posts || posts.length === 0) {
        setResults([])
        setLoading(false)
        return
      }

      // Filtrer par distance si un filtre de localisation est actif
      let filteredPosts = posts as Post[]
      if (locationCoords) {
        filteredPosts = (posts as Post[]).filter((post) => {
          if (!post.location_lat || !post.location_lng) return false
          
          const distance = calculateDistance(
            locationCoords.lat,
            locationCoords.lng,
            post.location_lat,
            post.location_lng
          )
          
          return distance <= 50 // 50 km de rayon
        })
      }

      if (filteredPosts.length === 0) {
        setResults([])
        setLoading(false)
        return
      }

      // Récupérer les IDs uniques pour les relations (utiliser filteredPosts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userIds = [...new Set(filteredPosts.map((p: any) => p.user_id).filter(Boolean))]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryIds = [...new Set(filteredPosts.map((p: any) => p.category_id).filter(Boolean))]

      // Récupérer les profils et catégories en parallèle pour améliorer les performances
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

      if (profilesResult.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profilesResult.data.forEach((profile: any) => {
          profilesMap.set(profile.id, profile)
        })
      }

      if (categoriesResult.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        categoriesResult.data.forEach((category: any) => {
          categoriesMap.set(category.id, category)
        })
      }

      // Combiner les données
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            name: category.name,
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

  const handleLocationSelect = (location: {
    address: string
    lat: number
    lng: number
    city?: string
  }) => {
    setLocationFilter(location.address)
    setLocationCoords({ lat: location.lat, lng: location.lng })
    setShowLocationFilter(false)
  }

  const handleClearLocation = () => {
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

          <div className="search-input-wrapper">
            <SearchIcon size={20} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <button
                className="search-clear-button"
                onClick={() => setSearchQuery('')}
              >
                <X size={20} />
              </button>
            )}
          </div>

          <button className="search-filters-button">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Filtre de localisation */}
        <div className="search-location-filter">
          <button
            className={`search-location-toggle ${locationFilter ? 'active' : ''}`}
            onClick={() => setShowLocationFilter(!showLocationFilter)}
          >
            <MapPin size={16} />
            <span>{locationFilter ? locationFilter.split(',')[0] : 'Filtrer par lieu'}</span>
            {locationFilter && (
              <button
                className="search-location-clear"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearLocation()
                }}
              >
                <X size={14} />
              </button>
            )}
          </button>
          {showLocationFilter && (
            <div className="search-location-autocomplete-wrapper">
              <LocationAutocomplete
                value={locationFilter}
                onChange={setLocationFilter}
                onLocationSelect={handleLocationSelect}
                placeholder="Rechercher un lieu (ex: Paris, Lyon...)"
              />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="search-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`search-filter-button ${selectedFilter === filter.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="search-content">
        {loading ? (
          <div className="search-loading">
            <p>Recherche en cours...</p>
          </div>
        ) : searchQuery.length > 0 ? (
          <>
            <div className="search-results-header">
              <p className="search-results-count">
                {results.length} résultat{results.length > 1 ? 's' : ''} pour "{searchQuery}"
              </p>
            </div>

            {results.length > 0 ? (
              <div className="search-results-list">
                {results.map((post) => (
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
                <p>Aucun résultat trouvé pour "{searchQuery}"</p>
              </div>
            )}
          </>
        ) : (
          <div className="search-empty-state">
            <div className="search-empty-icon">
              <SearchIcon size={36} />
            </div>
            <h2 className="search-empty-title">Rechercher une annonce</h2>
            <p className="search-empty-text">Tapez un mot-clé pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
