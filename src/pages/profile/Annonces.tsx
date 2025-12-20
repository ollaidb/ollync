import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Archive, Edit, MoreVertical, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import BackButton from '../../components/BackButton'
import './Annonces.css'

interface Post {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  needed_date: string | null
  category?: {
    name: string
    slug: string
  } | null
}

const Annonces = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'online' | 'expired'>('online')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  // Déterminer si une annonce est expirée
  const isPostExpired = (post: Post): boolean => {
    // Si needed_date existe et est passée, l'annonce est expirée
    if (post.needed_date) {
      const neededDate = new Date(post.needed_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return neededDate < today
    }
    
    // Sinon, considérer qu'une annonce est expirée après 30 jours
    const createdDate = new Date(post.created_at)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return createdDate < thirtyDaysAgo
  }

  // Vérifier si une annonce peut être éditée (moins de 24h après publication)
  const canEditPost = (post: Post): boolean => {
    const createdDate = new Date(post.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
    return hoursSinceCreation < 24
  }

  // Formater la date pour l'affichage
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Récupérer toutes les annonces de l'utilisateur
  const fetchUserPosts = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Récupérer les posts sans relation (plus fiable)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'archived'])
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        setPosts([])
        setLoading(false)
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Récupérer les catégories séparément
      const categoryIds = [...new Set(postsData.map((p: any) => p.category_id).filter(Boolean))]
      const categoriesMap = new Map()

      if (categoryIds.length > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds)

        if (!categoriesError && categories) {
          categories.forEach((category: any) => {
            categoriesMap.set(category.id, category)
          })
        }
      }

      // Combiner les données
      const postsWithCategories = postsData.map((post: any) => ({
        ...post,
        category: categoriesMap.get(post.category_id) || null
      }))

      setPosts(postsWithCategories as Post[])
    } catch (error) {
      console.error('Error in fetchUserPosts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserPosts()
  }, [fetchUserPosts])

  // Filtrer les annonces selon l'onglet actif
  const filteredPosts = posts.filter(post => {
    const expired = isPostExpired(post)
    if (activeTab === 'online') {
      return !expired && post.status === 'active'
    } else {
      return expired || post.status === 'archived'
    }
  })

  // Supprimer une annonce
  const handleDelete = async (postId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error deleting post:', error)
        alert('Erreur lors de la suppression de l\'annonce')
      } else {
        setPosts(posts.filter(p => p.id !== postId))
        setActionMenuOpen(null)
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('Erreur lors de la suppression de l\'annonce')
    }
  }

  // Archiver une annonce
  const handleArchive = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'archived' })
        .eq('id', postId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error archiving post:', error)
        alert('Erreur lors de l\'archivage de l\'annonce')
      } else {
        setPosts(posts.map(p => p.id === postId ? { ...p, status: 'archived' } : p))
        setActionMenuOpen(null)
      }
    } catch (error) {
      console.error('Error in handleArchive:', error)
      alert('Erreur lors de l\'archivage de l\'annonce')
    }
  }

  // Éditer une annonce (rediriger vers la page de publication avec l'ID)
  const handleEdit = (postId: string) => {
    navigate(`/publish?edit=${postId}`)
  }


  return (
    <div className="annonces-page">
      {/* Onglets */}
      <div className="annonces-tabs">
        <button
          className={`annonces-tab ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          En ligne
          {activeTab === 'online' && (
            <span className="annonces-tab-count">
              {posts.filter(p => !isPostExpired(p) && p.status === 'active').length}
            </span>
          )}
        </button>
        <button
          className={`annonces-tab ${activeTab === 'expired' ? 'active' : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          Expirées
          {activeTab === 'expired' && (
            <span className="annonces-tab-count">
              {posts.filter(p => isPostExpired(p) || p.status === 'archived').length}
            </span>
          )}
        </button>
      </div>

      {/* Liste des annonces */}
      <div className="annonces-content">
        {loading ? (
          <div className="annonces-loading">Chargement...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="annonces-empty">
            <p>
              {activeTab === 'online'
                ? 'Aucune annonce en ligne'
                : 'Aucune annonce expirée'}
            </p>
          </div>
        ) : (
          <div className="annonces-list">
            {filteredPosts.map((post) => {
              const canEdit = canEditPost(post)

              const handleItemClick = (e: React.MouseEvent) => {
                // Ne pas naviguer si on clique sur le menu d'actions
                const target = e.target as HTMLElement
                if (target.closest('.annonce-item-actions') || 
                    target.closest('.annonce-item-menu-button') ||
                    target.closest('.annonce-item-menu')) {
                  return
                }
                navigate(`/post/${post.id}`)
              }

              const handleMenuClick = (e: React.MouseEvent) => {
                e.stopPropagation()
                setActionMenuOpen(actionMenuOpen === post.id ? null : post.id)
              }

              return (
                <div 
                  key={post.id} 
                  className="annonce-item"
                  onClick={handleItemClick}
                >
                  <div className="annonce-item-content">
                    <h3 className="annonce-item-title">{post.title}</h3>
                    <div className="annonce-item-date">
                      <Calendar size={14} />
                      <span>
                        {isPostExpired(post) && post.needed_date
                          ? `Expirée le ${formatDate(post.needed_date)}`
                          : `Publiée le ${formatDate(post.created_at)}`}
                      </span>
                    </div>
                  </div>

                  {/* Menu d'actions */}
                  <div className="annonce-item-actions" onClick={handleMenuClick}>
                    <button
                      className="annonce-item-menu-button"
                      onClick={handleMenuClick}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {actionMenuOpen === post.id && (
                      <div className="annonce-item-menu">
                        {canEdit ? (
                          <button
                            className="annonce-item-menu-item"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(post.id)
                            }}
                          >
                            <Edit size={14} />
                            <span>Éditer</span>
                          </button>
                        ) : (
                          <div className="annonce-item-menu-item disabled">
                            <Edit size={14} />
                            <span>Édition disponible pendant 24h</span>
                          </div>
                        )}
                        <button
                          className="annonce-item-menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchive(post.id)
                          }}
                        >
                          <Archive size={14} />
                          <span>Archiver</span>
                        </button>
                        <button
                          className="annonce-item-menu-item destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(post.id)
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Overlay pour fermer le menu */}
      {actionMenuOpen && (
        <div
          className="annonces-overlay"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  )
}

export default Annonces

