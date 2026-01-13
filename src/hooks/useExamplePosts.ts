import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface ExamplePost {
  id: string
  title: string
  description: string
  images?: string[]
  is_urgent?: boolean
  user_id?: string
  user?: {
    id?: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
  likes_count?: number
}

export const useExamplePosts = (
  categorySlug: string | null,
  subcategorySlug: string | null,
  subSubCategorySlug?: string | null,
  subSubSubCategorySlug?: string | null
) => {
  const [examplePosts, setExamplePosts] = useState<ExamplePost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    const fetchExamplePosts = async () => {
      if (!categorySlug) {
        setExamplePosts([])
        return
      }

      setLoadingPosts(true)
      try {
        // Récupérer la catégorie depuis la base de données
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()

        if (!categoryData) {
          setExamplePosts([])
          setLoadingPosts(false)
          return
        }

        let query = supabase
          .from('posts')
          .select('id, title, description, images, is_urgent, user_id, likes_count')
          .eq('category_id', (categoryData as any).id)
          .eq('status', 'active')
          .limit(3)
          .order('created_at', { ascending: false })

        // Si une sous-catégorie est spécifiée, la récupérer aussi
        if (subcategorySlug && subcategorySlug !== 'tout') {
          const { data: subcategoryData } = await supabase
            .from('sub_categories')
            .select('id')
            .eq('category_id', (categoryData as any).id)
            .eq('slug', subcategorySlug)
            .single()

          if (subcategoryData) {
            query = query.eq('sub_category_id', (subcategoryData as any).id)
          }
        }

        const { data: postsData, error } = await query

        if (error) {
          console.error('Error fetching example posts:', error)
          setExamplePosts([])
        } else if (postsData && postsData.length > 0) {
          // Récupérer les profils utilisateurs
          const userIds = [...new Set(postsData.map((p: any) => p.user_id).filter(Boolean))]
          let usersMap = new Map()
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .in('id', userIds)
            
            if (profilesData) {
              profilesData.forEach((profile: any) => {
                usersMap.set(profile.id, profile)
              })
            }
          }
          
          // Combiner les posts avec les profils
          const postsWithUsers = postsData.map((post: any) => ({
            ...post,
            user: usersMap.get(post.user_id) || null
          }))
          
          setExamplePosts(postsWithUsers)
        } else {
          setExamplePosts([])
        }
      } catch (error) {
        console.error('Error fetching example posts:', error)
        setExamplePosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    fetchExamplePosts()
  }, [categorySlug, subcategorySlug, subSubCategorySlug, subSubSubCategorySlug])

  return { examplePosts, loadingPosts }
}

