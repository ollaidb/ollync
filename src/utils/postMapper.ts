/**
 * Utilitaire pour mapper les données de posts retournées par Supabase
 * vers le format attendu par les composants
 */

export interface SupabasePost {
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
  is_urgent?: boolean
  profiles?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  categories?: {
    name: string
    slug: string
  } | null
  [key: string]: any
}

export interface MappedPost {
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
  is_urgent: boolean
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

/**
 * Mappe un post Supabase vers le format attendu
 */
export function mapPost(post: SupabasePost): MappedPost {
  return {
    ...post,
    is_urgent: post.is_urgent ?? false,
    user: post.profiles || null,
    category: post.categories || null
  }
}

/**
 * Mappe un tableau de posts Supabase
 */
export function mapPosts(posts: SupabasePost[]): MappedPost[] {
  return posts.map(mapPost)
}

