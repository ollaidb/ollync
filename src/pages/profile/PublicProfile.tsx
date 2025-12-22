import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share, MapPin, Plus, Instagram, Facebook, Star, Edit, MoreHorizontal, AlertTriangle, Flag } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import BackButton from '../../components/BackButton'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import { PhotoModal } from '../../components/ProfilePage/PhotoModal'
import { EmptyState } from '../../components/EmptyState'
import PostCard from '../../components/PostCard'
import './PublicProfile.css'

interface ProfileData {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
  availability?: string | null
  skills?: string[]
  services?: string[]
  languages?: Array<{ name: string; level: string }>
  badges?: string[]
  social_links?: {
    instagram?: string
    tiktok?: string
    linkedin?: string
    twitter?: string
    facebook?: string
    website?: string
  } | null
}

interface Post {
  id: string
  title: string
  description: string
  images?: string[] | null
  price?: number | null
  location?: string | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  number_of_people?: number | null
  delivery_available: boolean
  category?: {
    name: string
    slug: string
  } | null
  user?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

interface Review {
  id: string
  rating: number
  comment?: string
  created_at: string
  reviewer_name?: string
  reviewer_avatar?: string
  mission_type?: string
}

const PublicProfile = ({ userId, isOwnProfile = false }: { userId?: string; isOwnProfile?: boolean }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'a-propos' | 'annonces' | 'avis'>('a-propos')
  const [posts, setPosts] = useState<Post[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<'behavior' | 'post' | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<string>('')

  const profileId = userId || user?.id

  const fetchProfile = useCallback(async () => {
    if (!profileId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Profil non trouvé, tentative de création depuis auth.users...')
        
        if (user && user.id === profileId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: createError } = await (supabase.from('profiles') as any)
            .insert({
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || null,
              username: user.user_metadata?.username || null
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            setProfile({
              id: user.id,
              username: user.user_metadata?.username || null,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: null,
              bio: null,
              location: null,
              created_at: new Date().toISOString()
            })
          } else if (newProfile) {
            setProfile(newProfile)
            setLoading(false)
            return
          }
        }
      } else {
        console.error('Error fetching profile:', error)
      }
    } else if (data) {
      // S'assurer que social_links est correctement parsé depuis JSONB
      const profileData = data as ProfileData
      // Si social_links est une string, le parser en JSON
      if (profileData.social_links && typeof profileData.social_links === 'string') {
        try {
          profileData.social_links = JSON.parse(profileData.social_links)
        } catch (e) {
          profileData.social_links = null
        }
      }
      setProfile(profileData)
    }
    setLoading(false)
  }, [profileId, user])

  const fetchFollowersCount = useCallback(async () => {
    if (!profileId) return

    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId)

    if (count !== null) {
      setFollowersCount(count)
    }
  }, [profileId])


  const checkFollowing = useCallback(async () => {
    if (!user || !profileId || isOwnProfile) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .single()

    setIsFavorite(!!data)
  }, [user, profileId, isOwnProfile])


  const fetchPosts = useCallback(async () => {
    if (!profileId) return

    setPostsLoading(true)
    const fetchedPosts = await fetchPostsWithRelations({
      userId: profileId,
      status: 'active',
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Filtrer les posts qui ne sont pas de type "creation-contenu"
    const nonCreationContenuPosts = fetchedPosts.filter(post => {
      const categorySlug = post.category?.slug
      return categorySlug !== 'creation-contenu'
    })

    setPosts(nonCreationContenuPosts)
    setPostsLoading(false)
  }, [profileId])


  const fetchReviews = useCallback(async () => {
    if (!profileId) return

    setReviewsLoading(true)
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(username, full_name, avatar_url)
      `)
      .eq('rated_user_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } else {
      // Transformer les données pour correspondre au format ReviewCard
      interface ReviewData {
        id: string
        rating: number
        comment: string | null
        mission_type: string | null
        created_at: string
        rater: {
          username: string | null
          full_name: string | null
          avatar_url: string | null
        } | null
      }
      const formattedReviews: Review[] = (data as ReviewData[] || []).map((review) => ({
        id: review.id,
        reviewer_name: review.rater?.full_name || review.rater?.username || undefined,
        reviewer_avatar: review.rater?.avatar_url || undefined,
        rating: review.rating,
        comment: review.comment || undefined,
        mission_type: review.mission_type || undefined,
        created_at: review.created_at
      }))
      setReviews(formattedReviews)
    }
    setReviewsLoading(false)
  }, [profileId])

  const handleToggleFavorite = async () => {
    if (!user || !profileId || isOwnProfile) return

    if (isFavorite) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)

      if (!error) {
        setIsFavorite(false)
        setFollowersCount(prev => Math.max(0, prev - 1))
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('follows') as any)
        .insert({
          follower_id: user.id,
          following_id: profileId
        })

      if (!error) {
        setIsFavorite(true)
        setFollowersCount(prev => prev + 1)
      }
    }
  }

  const handleShare = async () => {
    setShowMenu(false)
    const profileUrl = `${window.location.origin}/profile/${profileId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} - Profil`,
          text: `Découvrez le profil de ${displayName}`,
          url: profileUrl
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl)
        alert('Lien du profil copié dans le presse-papier')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Impossible de copier le lien')
      }
    }
  }

  const handleReportClick = () => {
    setShowMenu(false)
    setShowReportModal(true)
    setReportType(null)
    setSelectedPostId(null)
    setReportReason('')
  }

  const handleReportSubmit = async () => {
    if (!user || !profileId || !reportType || !reportReason) {
      alert('Veuillez remplir tous les champs')
      return
    }

    if (reportType === 'post' && !selectedPostId) {
      alert('Veuillez sélectionner une annonce')
      return
    }

    try {
      // @ts-ignore - reports table exists but not in types
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: profileId,
          reported_post_id: reportType === 'post' ? selectedPostId : null,
          report_type: reportType === 'post' ? 'post' : 'profile',
          report_reason: reportReason,
          report_category: reportType,
          description: null
        } as any)

      if (error) {
        console.error('Error submitting report:', error)
        alert('Erreur lors de l\'envoi du signalement')
      } else {
        alert('Signalement envoyé avec succès. Merci de votre contribution.')
        setShowReportModal(false)
        setReportType(null)
        setSelectedPostId(null)
        setReportReason('')
      }
    } catch (error) {
      console.error('Error in handleReportSubmit:', error)
      alert('Erreur lors de l\'envoi du signalement')
    }
  }

  useEffect(() => {
    if (profileId) {
      fetchProfile()
      fetchFollowersCount()
      if (!isOwnProfile && user) {
        checkFollowing()
      }
    }
  }, [profileId, user, isOwnProfile, fetchProfile, fetchFollowersCount, checkFollowing])

  useEffect(() => {
    if (profileId && activeTab === 'annonces') {
      fetchPosts()
    } else if (profileId && activeTab === 'avis') {
      fetchReviews()
    }
    // Pour "à propos", pas besoin de fetch, les données sont déjà dans profile
  }, [profileId, activeTab, fetchPosts, fetchReviews])

  if (loading) {
    return (
      <div className="public-profile-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="public-profile-empty">
        <p>Profil introuvable</p>
      </div>
    )
  }

  const displayName = profile.full_name || profile.username || 'Utilisateur'

  // Centres d'intérêt (combinaison de skills et services)
  const interests = [
    ...(profile.skills || []),
    ...(profile.services || [])
  ]

  return (
    <div className="public-profile-page">
      {/* 1. HEADER - Retour + Menu actions */}
      <div className="profile-page-header">
        <BackButton className="profile-back-button" />
        <div className="profile-header-spacer"></div>
        <div className="profile-header-actions">
          {isOwnProfile ? (
            <button
              className="profile-header-action-btn"
              onClick={() => navigate('/profile/edit')}
              aria-label="Éditer le profil"
            >
              <Edit size={20} />
            </button>
          ) : (
            <div className="profile-menu-container">
              <button 
                className="profile-header-action-btn"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Options"
              >
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <>
                  <div className="profile-menu-overlay" onClick={() => setShowMenu(false)}></div>
                  <div className="profile-menu-dropdown">
                    <button
                      className="profile-menu-item"
                      onClick={handleShare}
                    >
                      <Share size={18} />
                      <span>Partager le profil</span>
                    </button>
                    <button
                      className="profile-menu-item"
                      onClick={handleReportClick}
                    >
                      <Flag size={18} />
                      <span>Signaler le profil</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. BLOC D'IDENTITÉ (structure compacte horizontale) */}
      <div className="profile-identity-block">
        {/* Section gauche : Photo + Bouton Suivre */}
        <div className="profile-left-section">
          <div className="profile-avatar-container">
            <div 
              className="profile-avatar-small"
              onClick={() => setShowPhotoModal(true)}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(displayName[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            {/* Bouton Suivre (icône + seulement) */}
            {!isOwnProfile && user && !isFavorite && (
              <button
                className="profile-follow-icon-btn"
                onClick={handleToggleFavorite}
                aria-label="Suivre"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Section centre : Nom et informations */}
        <div className="profile-center-section">
          <h1 className="profile-full-name">{profile.full_name || 'nom de lutisateur'}</h1>
          {profile.username && (
            <p className="profile-username-text">{profile.username}</p>
          )}
          {profile.location && (
            <div className="profile-location-text">
              <span>{profile.location.split(',')[0].trim()}</span>
              <MapPin size={14} />
            </div>
          )}
        </div>

        {/* Section droite : Statistiques */}
        <div className="profile-right-section">
          <div className="profile-stats-inline">
            <div className="profile-stat-item">
              <div className="stat-number">{posts.length}</div>
              <div className="stat-label-text">annonce{posts.length > 1 ? 's' : ''}</div>
            </div>
            <div className="profile-stat-divider"></div>
            <div className="profile-stat-item">
              <div className="stat-number">{followersCount}</div>
              <div className="stat-label-text">abonné{followersCount > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MENU SECONDAIRE : À propos / Annonce / Avis */}
      <div className="profile-secondary-menu">
        <button
          className={`profile-menu-btn ${activeTab === 'a-propos' ? 'active' : ''}`}
          onClick={() => setActiveTab('a-propos')}
        >
          à propos
        </button>
        <button
          className={`profile-menu-btn ${activeTab === 'annonces' ? 'active' : ''}`}
          onClick={() => setActiveTab('annonces')}
        >
          annonce
        </button>
        <button
          className={`profile-menu-btn ${activeTab === 'avis' ? 'active' : ''}`}
          onClick={() => setActiveTab('avis')}
        >
          avis
        </button>
      </div>

      {/* 4. BLOC CONTENU (scrollable) */}
      <div className="profile-content-scrollable">
        {/* Mode À propos */}
        {activeTab === 'a-propos' && (
          <div className="profile-content-a-propos">
            {/* BLOC BIO */}
            {profile.bio && (
              <div className="profile-bio-block">
                <div className="bio-label">bio</div>
                <p className="bio-text">{profile.bio}</p>
              </div>
            )}

            {/* CENTRES D'INTÉRÊT */}
            {interests.length > 0 && (
              <div className="profile-interests-section">
                <h3 className="interests-title">centre dinteret</h3>
                <div className="interests-scroll">
                  {interests.map((interest, index) => (
                    <div 
                      key={index} 
                      className={`interest-bubble ${index === 0 ? 'active' : ''}`}
                    >
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIENS SOCIAUX */}
            {profile.social_links && (
              (profile.social_links.instagram || profile.social_links.tiktok || profile.social_links.facebook) && (
                <div className="profile-social-block">
                  {profile.social_links.instagram && (
                    <a
                      href={profile.social_links.instagram.startsWith('http') ? profile.social_links.instagram : `https://instagram.com/${profile.social_links.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-link"
                    >
                      <Instagram size={24} />
                    </a>
                  )}
                  {profile.social_links.tiktok && (
                    <a
                      href={profile.social_links.tiktok.startsWith('http') ? profile.social_links.tiktok : `https://tiktok.com/@${profile.social_links.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-link"
                    >
                      <div className="tiktok-icon">TT</div>
                    </a>
                  )}
                  {profile.social_links.facebook && (
                    <a
                      href={profile.social_links.facebook.startsWith('http') ? profile.social_links.facebook : `https://facebook.com/${profile.social_links.facebook.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-link"
                    >
                      <Facebook size={24} />
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* Mode Annonce - Grille horizontale scrollable */}
        {activeTab === 'annonces' && (
          <div className="profile-content-annonces">
            {postsLoading ? (
              <div className="loading-state">Chargement...</div>
            ) : posts.length === 0 ? (
              <EmptyState type="posts" />
            ) : (
              <div className="profile-posts-grid">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode="grid" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode Avis - Liste des avis */}
        {activeTab === 'avis' && (
          <div className="profile-content-avis">
            {reviewsLoading ? (
              <div className="loading-state">Chargement...</div>
            ) : reviews.length === 0 ? (
              <EmptyState type="category" customTitle="Aucun avis" customSubtext="Les avis sur ce profil apparaîtront ici." />
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header-item">
                      {review.reviewer_avatar ? (
                        <img src={review.reviewer_avatar} alt={review.reviewer_name || ''} className="review-avatar-img" />
                      ) : (
                        <div className="review-avatar-placeholder">
                          {(review.reviewer_name?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div className="review-author-info">
                        <div className="review-author-name">{review.reviewer_name || 'Anonyme'}</div>
                        <div className="review-rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={16} 
                              className={star <= review.rating ? 'filled' : ''}
                              fill={star <= review.rating ? '#ffc107' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="review-date-text">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="review-comment-text">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. FOOTER - Navigation globale (déjà géré par le composant Footer) */}

      <PhotoModal
        visible={showPhotoModal}
        avatar={profile.avatar_url}
        fullName={profile.full_name}
        username={profile.username}
        onClose={() => setShowPhotoModal(false)}
      />

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>Signaler</h2>
              <button 
                className="report-modal-close"
                onClick={() => setShowReportModal(false)}
              >
                ×
              </button>
            </div>

            <div className="report-modal-body">
              {!reportType ? (
                <>
                  <p className="report-modal-question">Que souhaitez-vous signaler ?</p>
                  <div className="report-options">
                    <button
                      className="report-option-btn"
                      onClick={() => setReportType('behavior')}
                    >
                      <AlertTriangle size={20} />
                      <span>Signaler son comportement</span>
                    </button>
                    <button
                      className="report-option-btn"
                      onClick={() => setReportType('post')}
                    >
                      <Flag size={20} />
                      <span>Signaler une annonce</span>
                    </button>
                  </div>
                </>
              ) : reportType === 'behavior' ? (
                <>
                  <button
                    className="report-back-btn"
                    onClick={() => {
                      setReportType(null)
                      setReportReason('')
                    }}
                  >
                    ← Retour
                  </button>
                  <p className="report-modal-question">Raison du signalement :</p>
                  <div className="report-reasons-list">
                    <button
                      className={`report-reason-btn ${reportReason === 'suspect' ? 'active' : ''}`}
                      onClick={() => setReportReason('suspect')}
                    >
                      Suspect
                    </button>
                    <button
                      className={`report-reason-btn ${reportReason === 'fraudeur' ? 'active' : ''}`}
                      onClick={() => setReportReason('fraudeur')}
                    >
                      Fraudeur
                    </button>
                    <button
                      className={`report-reason-btn ${reportReason === 'fondant' ? 'active' : ''}`}
                      onClick={() => setReportReason('fondant')}
                    >
                      Fondant / Inapproprié
                    </button>
                    <button
                      className={`report-reason-btn ${reportReason === 'sexuel' ? 'active' : ''}`}
                      onClick={() => setReportReason('sexuel')}
                    >
                      Contenu sexuel
                    </button>
                    <button
                      className={`report-reason-btn ${reportReason === 'spam' ? 'active' : ''}`}
                      onClick={() => setReportReason('spam')}
                    >
                      Spam
                    </button>
                    <button
                      className={`report-reason-btn ${reportReason === 'autre' ? 'active' : ''}`}
                      onClick={() => setReportReason('autre')}
                    >
                      Autre
                    </button>
                  </div>
                  {reportReason && (
                    <button
                      className="report-submit-btn"
                      onClick={handleReportSubmit}
                    >
                      Envoyer le signalement
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!selectedPostId ? (
                    <>
                      <button
                        className="report-back-btn"
                        onClick={() => {
                          setReportType(null)
                          setSelectedPostId(null)
                        }}
                      >
                        ← Retour
                      </button>
                      <p className="report-modal-question">Quelle annonce souhaitez-vous signaler ?</p>
                      <div className="report-posts-list">
                        {posts.length > 0 ? (
                          posts.map((post) => (
                            <button
                              key={post.id}
                              className={`report-post-item ${selectedPostId === post.id ? 'active' : ''}`}
                              onClick={() => setSelectedPostId(post.id)}
                            >
                              <div className="report-post-title">{post.title}</div>
                              <div className="report-post-date">
                                {new Date(post.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="report-no-posts">Aucune annonce disponible</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        className="report-back-btn"
                        onClick={() => {
                          setSelectedPostId(null)
                          setReportReason('')
                        }}
                      >
                        ← Retour
                      </button>
                      <p className="report-modal-question">Raison du signalement :</p>
                      <div className="report-reasons-list">
                        <button
                          className={`report-reason-btn ${reportReason === 'suspect' ? 'active' : ''}`}
                          onClick={() => setReportReason('suspect')}
                        >
                          Suspect
                        </button>
                        <button
                          className={`report-reason-btn ${reportReason === 'fraudeur' ? 'active' : ''}`}
                          onClick={() => setReportReason('fraudeur')}
                        >
                          Fraudeur
                        </button>
                        <button
                          className={`report-reason-btn ${reportReason === 'fondant' ? 'active' : ''}`}
                          onClick={() => setReportReason('fondant')}
                        >
                          Fondant / Inapproprié
                        </button>
                        <button
                          className={`report-reason-btn ${reportReason === 'sexuel' ? 'active' : ''}`}
                          onClick={() => setReportReason('sexuel')}
                        >
                          Contenu sexuel
                        </button>
                        <button
                          className={`report-reason-btn ${reportReason === 'spam' ? 'active' : ''}`}
                          onClick={() => setReportReason('spam')}
                        >
                          Spam
                        </button>
                        <button
                          className={`report-reason-btn ${reportReason === 'autre' ? 'active' : ''}`}
                          onClick={() => setReportReason('autre')}
                        >
                          Autre
                        </button>
                      </div>
                      {reportReason && (
                        <button
                          className="report-submit-btn"
                          onClick={handleReportSubmit}
                        >
                          Envoyer le signalement
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfile
