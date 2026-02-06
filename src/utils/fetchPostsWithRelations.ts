/**
 * Utilitaire pour récupérer les posts avec leurs relations
 * Utilise des requêtes séparées si les relations Supabase ne fonctionnent pas
 */

import { supabase } from '../lib/supabaseClient'
import { mapPosts, type MappedPost } from './postMapper'

interface FetchPostsOptions {
  categoryId?: string
  subCategoryId?: string
  userId?: string
  status?: string
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  useCache?: boolean
}

interface PostRow {
  id: string
  user_id: string
  category_id: string
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
  is_urgent?: boolean
  sub_category_id?: string | null
  profiles?: ProfileRow | null
  categories?: CategoryRow | null
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

// Cache simple en mémoire (session-based)
const cache = new Map<string, { data: MappedPost[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_LIMIT = 50

/**
 * Génère une clé de cache basée sur les options
 */
function getCacheKey(options: FetchPostsOptions): string {
  return JSON.stringify({
    categoryId: options.categoryId,
    subCategoryId: options.subCategoryId,
    userId: options.userId,
    status: options.status,
    limit: options.limit,
    offset: options.offset,
    orderBy: options.orderBy,
    orderDirection: options.orderDirection
  })
}

/**
 * Récupère les posts avec leurs relations (profiles et categories)
 * Utilise des requêtes séparées pour contourner les problèmes de relations Supabase
 * Optimisé pour ne charger que les champs nécessaires à l'affichage
 */
export async function fetchPostsWithRelations(options: FetchPostsOptions = {}) {
  const {
    categoryId,
    subCategoryId,
    userId,
    status = 'active',
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc',
    useCache = true
  } = options
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT)
  const safeOffset = Math.max(offset, 0)
  const cacheOptions = { ...options, limit: safeLimit, offset: safeOffset }

  // Vérifier le cache si activé et offset = 0 (première page)
  if (useCache && safeOffset === 0) {
    const cacheKey = getCacheKey(cacheOptions)
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  try {
    // 1. Récupérer les posts - seulement les champs nécessaires pour l'affichage liste
    // Ne pas charger tous les champs avec select('*')
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
      'sub_category_id',
      'profiles',
      'categories',
      'status'
    ].join(', ')

    let query = supabase
      .from('public_posts_with_relations')
      .select(fieldsToSelect)
      .eq('status', status)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (subCategoryId) {
      query = query.eq('sub_category_id', subCategoryId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(safeOffset, safeOffset + safeLimit - 1)

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    // 2. Mapper vers le format attendu
    const mappedPosts = mapPosts(posts as PostRow[])
    
    // Mettre en cache si activé et offset = 0 (première page)
    if (useCache && safeOffset === 0) {
      const cacheKey = getCacheKey(cacheOptions)
      cache.set(cacheKey, { data: mappedPosts, timestamp: Date.now() })
    }
    
    return mappedPosts
  } catch (error) {
    console.error('Error in fetchPostsWithRelations:', error)
    return []
  }
}

/**
 * Nettoie le cache (utile pour forcer un rechargement)
 */
export function clearPostsCache() {
  cache.clear()
}
