/**
 * Utilitaire pour récupérer les recommandations basées sur les actions de l'utilisateur
 * - Likes : catégories des posts likés
 * - Applications/demandes : catégories des annonces auxquelles l'utilisateur a postulé
 * - Publications : catégories des annonces publiées par l'utilisateur
 * - Recherches : catégories filtrées dans search_history
 * Exclut les posts déjà likés, déjà candidatés et les propres posts de l'utilisateur
 */

import { supabase } from '../lib/supabaseClient'
import { mapPosts, type MappedPost } from './postMapper'

interface FetchRecommendationsOptions {
  userId: string
  limit?: number
}

interface LikeRow {
  post_id: string
}

interface ApplicationRow {
  post_id: string
}

interface PostCategoryRow {
  id: string
  category_id: string
  sub_category_id?: string | null
}

interface SearchHistoryRow {
  filters?: { category_id?: string }
}

interface PostRow {
  id: string
  title: string
  description: string
  price?: number | null
  payment_type?: string | null
  location?: string | null
  images?: string[] | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  is_urgent?: boolean
  user_id: string
  category_id: string
  sub_category_id?: string | null
  [key: string]: unknown
}

interface ProfileRow {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
}

/**
 * Récupère les recommandations pour un utilisateur basées sur likes, applications, publications et recherches
 */
export async function fetchRecommendations(options: FetchRecommendationsOptions): Promise<MappedPost[]> {
  const { userId, limit = 10 } = options

  try {
    // 1. Récupérer en parallèle : likes, applications, publications de l'utilisateur, search_history
    const [likesRes, applicationsRes, userPostsRes, searchHistoryRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', userId),
      supabase.from('applications').select('post_id').eq('applicant_id', userId),
      supabase.from('posts').select('id, category_id, sub_category_id').eq('user_id', userId).in('status', ['active', 'archived', 'completed']),
      supabase.from('search_history').select('filters').eq('user_id', userId).order('searched_at', { ascending: false }).limit(20)
    ])

    const likedPostIds = !likesRes.error && likesRes.data ? (likesRes.data as LikeRow[]).map((l) => l.post_id) : []
    const appliedPostIds = !applicationsRes.error && applicationsRes.data ? (applicationsRes.data as ApplicationRow[]).map((a) => a.post_id) : []
    const userPostsData = !userPostsRes.error && userPostsRes.data ? (userPostsRes.data as PostCategoryRow[]) : []
    const searchHistoryData = !searchHistoryRes.error && searchHistoryRes.data ? (searchHistoryRes.data as SearchHistoryRow[]) : []

    // 2. Collecter les post IDs pour récupérer les catégories (likes + applications)
    const postIdsForCategories = [...new Set([...likedPostIds, ...appliedPostIds])]

    // 3. Extraire les catégories de toutes les sources
    const categoryIds = new Set<string>()

    // Depuis les posts likés ou postulés
    if (postIdsForCategories.length > 0) {
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, category_id, sub_category_id')
        .in('id', postIdsForCategories)
        .eq('status', 'active')

      if (postsData) {
        (postsData as PostCategoryRow[]).forEach((post) => {
          if (post.category_id) categoryIds.add(post.category_id)
        })
      }
    }

    // Depuis les publications de l'utilisateur (catégories dans lesquelles il publie)
    userPostsData.forEach((post) => {
      if (post.category_id) categoryIds.add(post.category_id)
    })

    // Depuis search_history (filters.category_id)
    searchHistoryData.forEach((row) => {
      if (row.filters?.category_id) categoryIds.add(row.filters.category_id)
    })

    if (categoryIds.size === 0) {
      return []
    }

    // 4. Posts à exclure : déjà likés, déjà postulés, propres posts
    const excludedPostIds = new Set<string>([...likedPostIds, ...appliedPostIds])

    // 5. Récupérer les posts recommandés dans les catégories préférées
    // Exclure les posts déjà likés et les propres posts de l'utilisateur
    const fieldsToSelect = [
      'id',
      'title',
      'description',
      'price',
      'payment_type',
      'location',
      'images',
      'likes_count',
      'comments_count',
      'created_at',
      'needed_date',
      'number_of_people',
      'delivery_available',
      'is_urgent',
      'user_id',
      'category_id',
      'sub_category_id'
    ].join(', ')

    // Trier par popularité (likes + comments) et récence
    const { data: recommendedPosts, error: postsError } = await supabase
      .from('posts')
      .select(fieldsToSelect)
      .eq('status', 'active')
      .neq('user_id', userId) // Exclure les propres posts de l'utilisateur
      .in('category_id', Array.from(categoryIds))
      .order('likes_count', { ascending: false })
      .order('comments_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Récupérer plus pour avoir un meilleur choix

    // Exclure les posts déjà likés/postulés après récupération
    const allRecommendedPosts = (recommendedPosts || []) as PostRow[]
    const filteredPosts = excludedPostIds.size > 0
      ? allRecommendedPosts.filter((post) => !excludedPostIds.has(post.id))
      : allRecommendedPosts

    if (postsError) {
      console.error('Error fetching recommended posts:', postsError)
      return []
    }

    if (filteredPosts.length === 0) {
      return []
    }

    // 6. Récupérer les relations (profiles et categories)
    const userIds = [...new Set(filteredPosts.map((p) => p.user_id).filter((id): id is string => Boolean(id)))]
    const categoryIdsArray = [...new Set(filteredPosts.map((p) => p.category_id).filter((id): id is string => Boolean(id)))]

    const [profilesResult, categoriesResult] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', userIds)
        : Promise.resolve({ data: null, error: null }),
      categoryIdsArray.length > 0
        ? supabase
            .from('categories')
            .select('id, name, slug')
            .in('id', categoryIdsArray)
        : Promise.resolve({ data: null, error: null })
    ])

    const profilesMap = new Map<string, ProfileRow>()
    const categoriesMap = new Map<string, CategoryRow>()

    if (!profilesResult.error && profilesResult.data) {
      (profilesResult.data as ProfileRow[]).forEach((profile) => {
        profilesMap.set(profile.id, profile)
      })
    }

    if (!categoriesResult.error && categoriesResult.data) {
      (categoriesResult.data as CategoryRow[]).forEach((category) => {
        categoriesMap.set(category.id, category)
      })
    }

    // 7. Combiner les données et mapper
    const postsWithRelations = filteredPosts.map((post) => {
      const profile = profilesMap.get(post.user_id) || null
      const category = categoriesMap.get(post.category_id) || null
      
      return {
        ...post,
        profiles: profile ? {
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        } : null,
        categories: category ? {
          name: category.name,
          slug: category.slug
        } : null
      }
    })

    const mappedPosts = mapPosts(postsWithRelations)

    // 8. Limiter le nombre de résultats et mélanger un peu pour la diversité
    // Prendre les meilleurs mais aussi quelques autres pour la variété
    const shuffled = [...mappedPosts].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit)
  } catch (error) {
    console.error('Error in fetchRecommendations:', error)
    return []
  }
}
