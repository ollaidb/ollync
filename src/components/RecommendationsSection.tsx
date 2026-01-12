import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import PostCard from './PostCard'
import { fetchRecommendations } from '../utils/fetchRecommendations'
import { useAuth } from '../hooks/useSupabase'
import { supabase } from '../lib/supabaseClient'
import './RecommendationsSection.css'

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

interface RecommendationsSectionProps {
  viewMode?: 'list' | 'grid'
}

const RecommendationsSection = ({ viewMode = 'grid' }: RecommendationsSectionProps) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActions, setHasActions] = useState<boolean | null>(null) // null = pas encore vérifié

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) {
        setLoading(false)
        setHasActions(false)
        return
      }

      try {
        setLoading(true)
        
        // D'abord vérifier si l'utilisateur a des actions (likes) dans l'application
        const { data: likes, error: likesError } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        // Si pas d'actions, ne pas charger les recommandations
        if (likesError || !likes || likes.length === 0) {
          setHasActions(false)
          setRecommendations([])
          setLoading(false)
          return
        }

        setHasActions(true)
        
        // Charger les recommandations seulement si l'utilisateur a des actions
        const recommendedPosts = await fetchRecommendations({
          userId: user.id,
          limit: 6
        })
        
        setRecommendations(recommendedPosts)
      } catch (err) {
        console.error('Error loading recommendations:', err)
        setHasActions(false)
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [user])

  // Ne rien afficher si :
  // - Pas d'utilisateur connecté
  // - Pas d'actions dans l'application
  // - Chargement terminé et aucune recommandation
  if (!user || hasActions === false || (!loading && recommendations.length === 0)) {
    return null
  }

  // Ne pas afficher de skeleton pendant le chargement initial
  // On attend de savoir s'il y a des actions avant d'afficher quoi que ce soit
  if (loading && hasActions === null) {
    return null
  }

  // Si on a des recommandations, les afficher
  if (recommendations.length > 0) {
    return (
      <div className="recommendations-section">
        <div className="recommendations-header">
          <div className="recommendations-title">
            <Sparkles size={20} />
            <h2>Recommandations pour vous</h2>
          </div>
          <p className="recommendations-subtitle">
            Basées sur vos likes et vos préférences
          </p>
        </div>
        <div className={`recommendations-posts ${viewMode}`}>
          {recommendations.map((post) => (
            <PostCard key={post.id} post={post} viewMode={viewMode} />
          ))}
        </div>
      </div>
    )
  }

  // Par défaut, ne rien afficher
  return null
}

export default RecommendationsSection
