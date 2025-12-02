import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HeaderSimple from '../components/HeaderSimple'
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

interface Category {
  id: string
}

interface SubCategory {
  id: string
}

const Mission = () => {
  const { submenu } = useParams<{ submenu?: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const defaultSubMenus = getDefaultSubMenus('mission')
  const [subMenus, setSubMenus] = useState<Array<{ name: string; slug: string }>>(defaultSubMenus)

  useEffect(() => {
    fetchSubMenus()
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submenu])

  const fetchSubMenus = async () => {
    const subMenusData = await fetchSubMenusForCategory('mission')
    setSubMenus(subMenusData)
  }

  const fetchPosts = async () => {
    setLoading(true)
    
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'mission')
      .single()

    if (!category || !(category as Category).id) {
      setLoading(false)
      return
    }

    const categoryId = (category as Category).id

    let subCategoryId: string | undefined

    if (submenu) {
      const { data: subCategory } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('slug', submenu)
        .eq('category_id', categoryId)
        .single()

      if (subCategory && (subCategory as SubCategory).id) {
        subCategoryId = (subCategory as SubCategory).id
      }
    }

    const posts = await fetchPostsWithRelations({
      categoryId,
      subCategoryId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    setPosts(posts)
    setLoading(false)
  }

  return (
    <div className="app">
      <HeaderSimple title="Mission" />
      <SubMenuNavigation category="mission" subMenus={subMenus} />
      <main className="main-content without-header category-page">
        <div className="category-content">
          {loading ? (
            <div className="loading-container">
              <p>Chargement...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>Aucune annonce disponible</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} viewMode="grid" />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Mission
