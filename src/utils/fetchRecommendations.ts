/**
 * Utilitaire pour récupérer les recommandations basées sur les actions de l'utilisateur
 * - Likes : Recommande des posts dans les mêmes catégories que les posts likés
 * - Exclut les posts déjà likés par l'utilisateur
 * - Exclut les propres posts de l'utilisateur
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

interface LikedPostData {
  id: string
  category_id: string
  sub_category_id?: string | null
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
 * Récupère les recommandations pour un utilisateur basées sur ses likes
 */
export async function fetchRecommendations(options: FetchRecommendationsOptions): Promise<MappedPost[]> {
  const { userId, limit = 10 } = options

  try {
    // 1. Récupérer les IDs des posts que l'utilisateur a likés
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)

    if (likesError) {
      console.error('Error fetching liked posts:', likesError)
      return []
    }

    // Si l'utilisateur n'a pas encore liké de posts, retourner un tableau vide
    if (!likes || likes.length === 0) {
      return []
    }

    const likedPostIds = (likes as LikeRow[]).map((like) => like.post_id)

    // 2. Récupérer les posts likés pour obtenir leurs catégories
    const { data: likedPostsData, error: likedPostsError } = await supabase
      .from('posts')
      .select('id, category_id, sub_category_id')
      .in('id', likedPostIds)
      .eq('status', 'active')

    if (likedPostsError) {
      console.error('Error fetching liked posts data:', likedPostsError)
      return []
    }

    if (!likedPostsData || likedPostsData.length === 0) {
      return []
    }

    // 3. Extraire les catégories uniques des posts likés
    const categoryIds = new Set<string>()
    const subCategoryIds = new Set<string>()
    
    const likedPosts = likedPostsData as LikedPostData[]
    likedPosts.forEach((post) => {
      if (post.category_id) {
        categoryIds.add(post.category_id)
      }
      if (post.sub_category_id) {
        subCategoryIds.add(post.sub_category_id)
      }
    })

    // Si aucune catégorie trouvée, retourner un tableau vide
    if (categoryIds.size === 0) {
      return []
    }

    // 4. Créer un Set des IDs des posts déjà likés (pour les exclure)
    const likedPostIdsSet = new Set<string>(likedPostIds)

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

    // Exclure les posts déjà likés après récupération
    const allRecommendedPosts = (recommendedPosts || []) as PostRow[]
    const filteredPosts = likedPostIdsSet.size > 0
      ? allRecommendedPosts.filter((post) => !likedPostIdsSet.has(post.id))
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
