/**
 * Utilitaire pour mapper les données de posts retournées par Supabase
 * vers le format attendu par les composants
 */

import i18n from '../i18n'

export interface SupabasePost {
  id: string
  user_id?: string
  listing_type?: string | null
  title: string
  description: string
  price?: number | null
  location?: string | null
  images?: string[] | null
  video?: string | null
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
  [key: string]: unknown
}

export interface MappedPost {
  id: string
  user_id?: string
  listing_type?: string | null
  payment_type?: string | null
  title: string
  description: string
  price?: number | null
  location?: string | null
  images?: string[] | null
  video?: string | null
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
  const translatedCategory = post.categories
    ? {
        ...post.categories,
        name: i18n.t(`categories:titles.${post.categories.slug}`, {
          defaultValue: post.categories.name
        })
      }
    : null

  return {
    ...post,
    is_urgent: post.is_urgent ?? false,
    user: post.profiles || null,
    category: translatedCategory
  }
}

/**
 * Mappe un tableau de posts Supabase
 */
export function mapPosts(posts: SupabasePost[]): MappedPost[] {
  return posts.map(mapPost)
}
