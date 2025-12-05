import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface ExamplePost {
  id: string
  title: string
  description: string
  images?: string[]
}

export const useExamplePosts = (
  categorySlug: string | null,
  subcategorySlug: string | null
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
          .select('id, title, description, images')
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

        const { data, error } = await query

        if (error) {
          console.error('Error fetching example posts:', error)
          setExamplePosts([])
        } else {
          setExamplePosts(data || [])
        }
      } catch (error) {
        console.error('Error fetching example posts:', error)
        setExamplePosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    fetchExamplePosts()
  }, [categorySlug, subcategorySlug])

  return { examplePosts, loadingPosts }
}

