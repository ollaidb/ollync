import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Archive, Edit, MoreHorizontal, CheckCircle, RotateCcw, Star, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConfirmation } from '../../hooks/useConfirmation'
import { useToastContext } from '../../contexts/ToastContext'
import ConfirmationModal from '../../components/ConfirmationModal'
import PostCard from '../../components/PostCard'
import './Annonces.css'

interface Post {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  needed_date: string | null
  price?: number | null
  payment_type?: string | null
  location?: string | null
  images?: string[] | null
  likes_count: number
  comments_count: number
  delivery_available: boolean
  is_urgent?: boolean
  number_of_people?: number | null
  category?: {
    name: string
    slug: string
  } | null
}

interface ParticipantProfile {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

const Annonces = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useToastContext()
  const [activeTab, setActiveTab] = useState<'online' | 'completed' | 'archived'>('online')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const confirmation = useConfirmation()
  const [ratingPost, setRatingPost] = useState<Post | null>(null)
  const [ratingParticipants, setRatingParticipants] = useState<ParticipantProfile[]>([])
  const [ratingsByUser, setRatingsByUser] = useState<Record<string, number>>({})
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [ratingsSaving, setRatingsSaving] = useState(false)
  const [ratingsError, setRatingsError] = useState<string | null>(null)

  // Vérifier si une annonce peut être éditée (moins de 24h après publication)
  const canEditPost = (post: Post): boolean => {
    const createdDate = new Date(post.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
    return hoursSinceCreation < 24
  }

  // Récupérer toutes les annonces de l'utilisateur
  const fetchUserPosts = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Récupérer les posts avec toutes les données nécessaires
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'archived', 'completed'] as any)
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

      // Combiner les données avec les valeurs par défaut nécessaires
      const postsWithCategories = postsData.map((post: any) => ({
        ...post,
        category: categoriesMap.get(post.category_id) || null,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        delivery_available: post.delivery_available || false,
        images: post.images || null,
        price: post.price || null,
        payment_type: post.payment_type || null,
        location: post.location || null,
        number_of_people: post.number_of_people || null,
        is_urgent: post.is_urgent || false
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
    if (activeTab === 'online') {
      return post.status === 'active'
    } else if (activeTab === 'completed') {
      return post.status === 'completed'
    } else if (activeTab === 'archived') {
      return post.status === 'archived'
    }
    return false
  })

  const activePost = actionMenuOpen ? posts.find(post => post.id === actionMenuOpen) : null

  // Supprimer une annonce
  const handleDelete = async (postId: string) => {
    setActionMenuOpen(null)
    confirmation.confirm(
      {
        title: 'Supprimer l\'annonce',
        message: 'Cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler'
      },
      async () => {
        if (!user?.id) return

        try {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id)

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
    )
  }

  // Marquer une annonce comme réalisée
  const handleComplete = async (postId: string) => {
    if (!user?.id) return

    setActionMenuOpen(null)
    confirmation.confirm(
      {
        title: 'Marquer comme réalisée',
        message: 'Marquer cette annonce comme réalisée ? Elle ne sera plus visible publiquement.',
        confirmLabel: 'Continuer',
        cancelLabel: 'Annuler'
      },
      async () => {
        try {
          const { error } = await (supabase.from('posts') as any)
            .update({ status: 'completed' })
            .eq('id', postId)
            .eq('user_id', user.id)

          if (error) {
            console.error('Error completing post:', error)
            alert('Erreur lors de la validation de l\'annonce')
          } else {
            const updatedPost = posts.find(p => p.id === postId)
            setPosts(posts.map(p => p.id === postId ? { ...p, status: 'completed' } : p))
            setActionMenuOpen(null)
            if (updatedPost) {
              await openRatingModal(updatedPost)
            }
          }
        } catch (error) {
          console.error('Error in handleComplete:', error)
          alert('Erreur lors de la validation de l\'annonce')
        }
      }
    )
  }

  // Archiver une annonce
  const handleArchive = async (postId: string) => {
    if (!user?.id) return

    try {
      const { error } = await (supabase.from('posts') as any)
        .update({ status: 'archived' })
        .eq('id', postId)
        .eq('user_id', user.id)

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

  // Remettre en ligne une annonce (depuis archivée ou réalisée)
  const handleReactivate = async (postId: string) => {
    if (!user?.id) return

    setActionMenuOpen(null)
    confirmation.confirm(
      {
        title: 'Remettre en ligne',
        message: 'Remettre cette annonce en ligne ? Elle sera à nouveau visible publiquement.',
        confirmLabel: 'Continuer',
        cancelLabel: 'Annuler'
      },
      async () => {
        try {
          const { error } = await (supabase.from('posts') as any)
            .update({ status: 'active' })
            .eq('id', postId)
            .eq('user_id', user.id)

          if (error) {
            console.error('Error reactivating post:', error)
            alert('Erreur lors de la remise en ligne de l\'annonce')
          } else {
            setPosts(posts.map(p => p.id === postId ? { ...p, status: 'active' } : p))
            setActionMenuOpen(null)
          }
        } catch (error) {
          console.error('Error in handleReactivate:', error)
          alert('Erreur lors de la remise en ligne de l\'annonce')
        }
      }
    )
  }

  // Éditer une annonce (rediriger vers la page de publication avec l'ID)
  const handleEdit = (postId: string) => {
    navigate(`/publish?edit=${postId}`)
  }

  const formatParticipantName = (profile?: ParticipantProfile | null) => {
    if (!profile) return 'Utilisateur'
    return profile.full_name || profile.username || 'Utilisateur'
  }

  const openRatingModal = async (post: Post) => {
    if (!user?.id) return
    setRatingsLoading(true)
    setRatingsError(null)
    setRatingPost(post)
    setRatingParticipants([])
    setRatingsByUser({})
    setActionMenuOpen(null)

    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('applicant_id, applicant:profiles!applications_applicant_id_fkey(id, username, full_name, avatar_url)')
        .eq('post_id', post.id)
        .eq('status', 'accepted')

      if (applicationsError) {
        console.error('Error loading participants:', applicationsError)
        setRatingsError('Impossible de charger les participants.')
        return
      }

      const participants = (applicationsData || [])
        .map((app: { applicant?: ParticipantProfile | null }) => app.applicant)
        .filter((profile): profile is ParticipantProfile => !!profile)
        .filter((profile) => profile.id !== user.id)

      setRatingParticipants(participants)

      if (participants.length === 0) {
        return
      }

      const { data: existingRatings, error: ratingsLoadError } = await supabase
        .from('ratings')
        .select('rated_user_id, rating')
        .eq('post_id', post.id)
        .eq('rater_id', user.id)

      if (ratingsLoadError) {
        console.error('Error loading existing ratings:', ratingsLoadError)
        return
      }

      const ratingsMap: Record<string, number> = {}
      ;(existingRatings || []).forEach((rating: { rated_user_id: string; rating: number }) => {
        ratingsMap[rating.rated_user_id] = rating.rating
      })
      setRatingsByUser(ratingsMap)
    } finally {
      setRatingsLoading(false)
    }
  }

  const closeRatingModal = () => {
    setRatingPost(null)
    setRatingParticipants([])
    setRatingsByUser({})
    setRatingsError(null)
  }

  const handleRatingChange = (userId: string, rating: number) => {
    setRatingsByUser((prev) => ({
      ...prev,
      [userId]: rating
    }))
  }

  const handleSaveRatings = async () => {
    if (!user?.id || !ratingPost) return

    if (ratingParticipants.length === 0) {
      setRatingsError('Aucun participant à noter pour cette annonce.')
      return
    }

    const missingRating = ratingParticipants.find(
      (participant) => !ratingsByUser[participant.id] || ratingsByUser[participant.id] < 1
    )

    if (missingRating) {
      setRatingsError('Donnez une note pour chaque participant.')
      return
    }

    setRatingsSaving(true)
    setRatingsError(null)

    try {
      const payload = ratingParticipants.map((participant) => ({
        rater_id: user.id,
        rated_user_id: participant.id,
        post_id: ratingPost.id,
        rating: ratingsByUser[participant.id]
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('ratings') as any)
        .upsert(payload, { onConflict: 'rater_id,rated_user_id,post_id' })

      if (error) {
        console.error('Error saving ratings:', error)
        setRatingsError('Impossible d\'enregistrer les avis.')
        showError('Erreur lors de l\'enregistrement des avis.')
        return
      }

      showSuccess('Avis enregistrés.')
      closeRatingModal()
    } catch (error) {
      console.error('Error in handleSaveRatings:', error)
      setRatingsError('Impossible d\'enregistrer les avis.')
      showError('Erreur lors de l\'enregistrement des avis.')
    } finally {
      setRatingsSaving(false)
    }
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
              {posts.filter(p => p.status === 'active').length}
            </span>
          )}
        </button>
        <button
          className={`annonces-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Réalisées
          {activeTab === 'completed' && (
            <span className="annonces-tab-count">
              {posts.filter(p => p.status === 'completed').length}
            </span>
          )}
        </button>
        <button
          className={`annonces-tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archivées
          {activeTab === 'archived' && (
            <span className="annonces-tab-count">
              {posts.filter(p => p.status === 'archived').length}
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
                : activeTab === 'completed'
                ? 'Aucune annonce réalisée'
                : 'Aucune annonce archivée'}
            </p>
          </div>
        ) : (
          <div className="annonces-list">
            {filteredPosts.map((post) => {
              const handleMenuClick = (e: React.MouseEvent) => {
                e.stopPropagation()
                setActionMenuOpen(actionMenuOpen === post.id ? null : post.id)
              }

              const actionMenuContent = (
                <div className="annonce-item-actions">
                  <button
                    className="annonce-item-menu-button"
                    onClick={handleMenuClick}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              )

              return (
                <PostCard 
                  key={post.id}
                  post={post} 
                  viewMode="list" 
                  hideProfile={true}
                  actionMenu={actionMenuContent}
                />
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

      {actionMenuOpen && activePost && (
        <div className="annonce-item-menu" onClick={(e) => e.stopPropagation()}>
          {activePost.status === 'active' && (
            <>
              {canEditPost(activePost) ? (
                <button
                  className="annonce-item-menu-item"
                  onClick={() => handleEdit(activePost.id)}
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
                onClick={() => handleComplete(activePost.id)}
              >
                <CheckCircle size={14} />
                <span>Réaliser</span>
              </button>
              <button
                className="annonce-item-menu-item"
                onClick={() => handleArchive(activePost.id)}
              >
                <Archive size={14} />
                <span>Archiver</span>
              </button>
            </>
          )}
          {(activePost.status === 'completed' || activePost.status === 'archived') && (
            <>
              {activePost.status === 'completed' && (
                <button
                  className="annonce-item-menu-item"
                  onClick={() => openRatingModal(activePost)}
                >
                  <Star size={14} />
                  <span>Noter les participants</span>
                </button>
              )}
              <button
                className="annonce-item-menu-item"
                onClick={() => handleReactivate(activePost.id)}
              >
                <RotateCcw size={14} />
                <span>Remettre en ligne</span>
              </button>
              {activePost.status === 'completed' && (
                <button
                  className="annonce-item-menu-item"
                  onClick={() => handleArchive(activePost.id)}
                >
                  <Archive size={14} />
                  <span>Archiver</span>
                </button>
              )}
            </>
          )}
          <button
            className="annonce-item-menu-item destructive"
            onClick={() => handleDelete(activePost.id)}
          >
            <Trash2 size={14} />
            <span>Supprimer</span>
          </button>
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmation.options && (
        <ConfirmationModal
          visible={confirmation.isOpen}
          title={confirmation.options.title}
          message={confirmation.options.message}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
          confirmLabel={confirmation.options.confirmLabel}
          cancelLabel={confirmation.options.cancelLabel}
        />
      )}

      {ratingPost && (
        <div className="rating-modal-overlay" onClick={closeRatingModal}>
          <div className="rating-modal" onClick={(event) => event.stopPropagation()}>
            <div className="rating-modal-header">
              <div>
                <h3>Laisser un avis</h3>
                <p>Annonce : {ratingPost.title}</p>
              </div>
              <button className="rating-modal-close" onClick={closeRatingModal} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="rating-modal-body">
              {ratingsLoading ? (
                <div className="rating-loading">Chargement des participants...</div>
              ) : ratingParticipants.length === 0 ? (
                <div className="rating-empty">
                  Aucun participant accepté pour cette annonce.
                </div>
              ) : (
                <div className="rating-participants">
                  {ratingParticipants.map((participant) => {
                    const displayName = formatParticipantName(participant)
                    const avatarUrl =
                      participant.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`

                    return (
                      <div key={participant.id} className="rating-participant-row">
                        <div className="rating-participant-info">
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="rating-participant-avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                            }}
                          />
                          <span className="rating-participant-name">{displayName}</span>
                        </div>
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className={`rating-star-btn ${star <= (ratingsByUser[participant.id] || 0) ? 'active' : ''}`}
                              onClick={() => handleRatingChange(participant.id, star)}
                              aria-label={`Noter ${displayName} ${star} étoiles`}
                            >
                              <Star size={18} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {ratingsError && <div className="rating-error">{ratingsError}</div>}
            </div>

            {ratingParticipants.length > 0 && (
              <div className="rating-modal-actions">
                <button className="rating-secondary-btn" onClick={closeRatingModal}>
                  Plus tard
                </button>
                <button
                  className="rating-primary-btn"
                  onClick={handleSaveRatings}
                  disabled={ratingsSaving}
                >
                  {ratingsSaving ? 'Enregistrement...' : 'Enregistrer les avis'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Annonces

