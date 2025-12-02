import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import SubMenuNavigation from '../components/SubMenuNavigation'
import Footer from '../components/Footer'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
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

const Vente = () => {
  const { submenu, subSubMenu } = useParams<{ submenu?: string; subSubMenu?: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const defaultSubMenus = getDefaultSubMenus('vente')
  const [subMenus, setSubMenus] = useState<Array<{ name: string; slug: string }>>(defaultSubMenus)

  useEffect(() => {
    fetchSubMenus()
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submenu, subSubMenu])

  const fetchSubMenus = async () => {
    const subMenusData = await fetchSubMenusForCategory('vente')
    setSubMenus(subMenusData)
  }

  const fetchPosts = async () => {
    setLoading(true)
    
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'vente')
      .single()

    if (!category) {
      setLoading(false)
      return
    }

    const categoryId = (category as { id: string }).id

    let subCategoryId: string | undefined

    if (submenu) {
      const { data: subCategory } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('slug', submenu)
        .eq('category_id', categoryId)
        .single()

      if (subCategory) {
        subCategoryId = (subCategory as { id: string }).id
      }
    }

    let posts = await fetchPostsWithRelations({
      categoryId,
      subCategoryId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer par sous-sous-menu si présent
    if (subSubMenu) {
      posts = posts.filter((post) => {
        const titleMatch = post.title?.toLowerCase().includes(subSubMenu.toLowerCase())
        const descMatch = post.description?.toLowerCase().includes(subSubMenu.toLowerCase())
        return titleMatch || descMatch
      })
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
            <BackButton />
            <h1 className="category-title">Vente</h1>
            <div className="category-header-spacer"></div>
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
          <SubMenuNavigation category="vente" subMenus={subMenus} />
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

export default Vente
