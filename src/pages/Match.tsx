import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import SubMenuNavigation from '../components/SubMenuNavigation'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import { getDefaultSubMenus } from '../utils/defaultSubMenus'
import { fetchSubMenusForCategory } from '../utils/categoryHelpers'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import './CategoryPage.css'

interface Post {
  id: string
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

const Match = () => {
  const { submenu } = useParams<{ submenu?: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const defaultSubMenus = getDefaultSubMenus('match')
  const [subMenus, setSubMenus] = useState<Array<{ name: string; slug: string }>>(defaultSubMenus)

  useEffect(() => {
    fetchSubMenus()
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submenu])

  const fetchSubMenus = async () => {
    const subMenusData = await fetchSubMenusForCategory('match')
    setSubMenus(subMenusData)
  }

  const fetchPosts = async () => {
    setLoading(true)
    
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'match')
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!category || !(category as any).id) {
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryId = (category as any).id

    let subCategoryId: string | undefined
    let mediaType: string | undefined

    if (submenu) {
      // Gérer les sous-catégories Photo et Vidéo pour Création de contenu
      if (submenu === 'creation-contenu-photo') {
        const { data: creationSubCat } = await supabase
          .from('sub_categories')
          .select('id')
          .eq('slug', 'creation-contenu')
          .eq('category_id', categoryId)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (creationSubCat && (creationSubCat as any).id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subCategoryId = (creationSubCat as any).id
          mediaType = 'photo'
        }
      } else if (submenu === 'creation-contenu-video') {
        const { data: creationSubCat } = await supabase
          .from('sub_categories')
          .select('id')
          .eq('slug', 'creation-contenu')
          .eq('category_id', categoryId)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (creationSubCat && (creationSubCat as any).id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subCategoryId = (creationSubCat as any).id
          mediaType = 'video'
        }
      } else {
        const { data: subCategory } = await supabase
          .from('sub_categories')
          .select('id')
          .eq('slug', submenu)
          .eq('category_id', categoryId)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (subCategory && (subCategory as any).id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subCategoryId = (subCategory as any).id
        }
      }
    }

    // Récupérer les posts avec relations
    let posts = await fetchPostsWithRelations({
      categoryId,
      subCategoryId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer par media_type si nécessaire
    if (mediaType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      posts = posts.filter((post: any) => (post as any).media_type === mediaType)
    }

    setPosts(posts)
    setFilteredPosts(posts)
    setLoading(false)
  }

  // Filtrer les posts en fonction de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = posts.filter((post) => {
      return (
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.location?.toLowerCase().includes(query)
      )
    })
    setFilteredPosts(filtered)
  }, [searchQuery, posts])

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div className="app">
      <div className="category-page">
        {/* Header fixe */}
        <div className="category-header-fixed">
          <div className="category-header-content">
            <h1 className="category-title">Match</h1>
          </div>
        </div>

        {/* Barre de recherche fixe */}
        <div className="category-search-fixed">
          <div className="category-search-wrapper">
            <div className="category-search-input">
              <Search size={20} className="category-search-icon" />
              <input
                type="text"
                placeholder="Rechercher des annonces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="category-search-field"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="category-search-clear"
                  aria-label="Effacer la recherche"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SubMenu Navigation fixe */}
        <div className="category-submenu-fixed">
          <SubMenuNavigation category="match" subMenus={subMenus} />
        </div>

        {/* Zone scrollable */}
        <div className="category-scrollable">
          <div className="category-content">
          {loading ? (
            <div className="loading-container">
              <p>Chargement...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <p>{searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucune annonce disponible'}</p>
            </div>
          ) : (
            <div className="posts-grid">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} viewMode="grid" />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Match
