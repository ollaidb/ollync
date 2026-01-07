import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook pour vérifier les likes en batch pour plusieurs posts
 * Évite de faire une requête par post
 */
export function useBatchLikes(postIds: string[]) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLikes = async () => {
      if (postIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLikedPosts(new Set())
          setLoading(false)
          return
        }

        // Requête batch pour tous les posts
        const { data, error } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)

        if (error) {
          console.error('Error checking likes:', error)
          setLikedPosts(new Set())
        } else {
          const likedSet = new Set(data?.map((like: any) => like.post_id) || [])
          setLikedPosts(likedSet)
        }
      } catch (error) {
        console.error('Error in useBatchLikes:', error)
        setLikedPosts(new Set())
      } finally {
        setLoading(false)
      }
    }

    checkLikes()
  }, [postIds.join(',')]) // Utiliser join pour créer une dépendance stable

  const isLiked = useMemo(() => {
    return (postId: string) => likedPosts.has(postId)
  }, [likedPosts])

  return { isLiked, loading }
}

