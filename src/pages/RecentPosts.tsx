import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import BackButton from '../components/BackButton'
import InlineVideoPreview from '../components/InlineVideoPreview'
import CategoryPlaceholderMedia from '../components/CategoryPlaceholderMedia'
import { useAuth } from '../hooks/useSupabase'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import type { MappedPost } from '../utils/postMapper'
import { PAYMENT_OPTIONS_CONFIG } from '../utils/paymentOptions'
import './SwipePage.css'

type Post = MappedPost

const RecentPosts = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFilter, setDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [pendingSortOrder, setPendingSortOrder] = useState<'desc' | 'asc'>('desc')
  const [pendingDateFilter, setPendingDateFilter] = useState<'all' | '1d' | '2d' | '7d' | '2w' | '3w' | '1m' | '2m'>('all')
  const [pendingListingTypeFilter, setPendingListingTypeFilter] = useState<'all' | 'offer' | 'request'>('all')
  const [pendingPaymentTypeFilter, setPendingPaymentTypeFilter] = useState<string>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedPosts = await fetchPostsWithRelations({
        status: 'active',
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'desc',
        useCache: true,
        excludeUserId: user?.id
      })

      setPosts(fetchedPosts)
      setError(null)
    } catch (err) {
      console.error('Error fetching recent posts:', err)
      setError('Erreur lors du chargement des annonces récentes')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const now = Date.now()
    const dateLimitMs = dateFilter === '1d'
      ? 24 * 60 * 60 * 1000
      : dateFilter === '2d'
        ? 2 * 24 * 60 * 60 * 1000
      : dateFilter === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : dateFilter === '2w'
            ? 14 * 24 * 60 * 60 * 1000
            : dateFilter === '3w'
              ? 21 * 24 * 60 * 60 * 1000
              : dateFilter === '1m'
                ? 30 * 24 * 60 * 60 * 1000
                : dateFilter === '2m'
                  ? 60 * 24 * 60 * 60 * 1000
                  : null

    const filtered = posts.filter((post) => {
      const matchesQuery = normalizedQuery.length === 0
        || post.title.toLowerCase().includes(normalizedQuery)
        || post.description.toLowerCase().includes(normalizedQuery)

      const createdAt = new Date(post.created_at).getTime()
      const matchesDate = dateLimitMs ? createdAt >= now - dateLimitMs : true

      const matchesOwner = user ? post.user_id !== user.id : true

      const matchesListingType =
        listingTypeFilter === 'all' || post.listing_type === listingTypeFilter
      const matchesPaymentType =
        paymentTypeFilter === 'all' || post.payment_type === paymentTypeFilter

      return matchesQuery && matchesDate && matchesOwner && matchesListingType && matchesPaymentType
    })

    return filtered.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [posts, searchQuery, dateFilter, sortOrder, listingTypeFilter, paymentTypeFilter, user])

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/home', { replace: true })
  }

  const handleProfileClick = (e: React.MouseEvent, userId?: string) => {
    e.stopPropagation()
    if (userId) {
      navigate(`/profile/public/${userId}`)
    }
  }

  return (
    <div className="swipe-page recent-posts-page">
      {/* Header fixe */}
      <div className="swipe-header-fixed">
        <div className="swipe-header-content">
          <BackButton className="swipe-back-button" onClick={handleBack} />
          <h1 className="swipe-title">Annonces récentes</h1>
          <div className="swipe-header-spacer"></div>
        </div>
        <div className="swipe-search-row">
          <div className="swipe-search-bar">
            <Search size={18} />
            <input
              className="swipe-search-input"
              type="text"
              placeholder="Rechercher une annonce"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="swipe-filter-toggle"
            onClick={() => {
              setPendingSortOrder(sortOrder)
              setPendingDateFilter(dateFilter)
              setPendingListingTypeFilter(listingTypeFilter)
              setPendingPaymentTypeFilter(paymentTypeFilter)
              setIsFilterOpen(true)
            }}
            aria-label="Filtrer"
          >
            <SlidersHorizontal size={18} />
          </button>
          </div>
        </div>
      </div>

      {/* Zone scrollable */}
      <div className="swipe-scrollable">
        {loading ? (
          <div className="swipe-loading">
            <p>Chargement des annonces...</p>
          </div>
        ) : error ? (
          <div className="swipe-empty">
            <p>{error}</p>
            <button onClick={handleRetry} className="swipe-btn-primary">
              <RefreshCw size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Réessayer
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="swipe-empty">
            <p>Aucune annonce récente disponible</p>
            <button onClick={() => navigate('/home')} className="swipe-btn-primary">
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <div className="swipe-masonry">
            {filteredPosts.map((post) => {
              const mainImage = post.images && post.images.length > 0 ? post.images[0] : null
              const mainMedia = mainImage || post.video || null
              const isVideo = !!mainMedia && /\.(mp4|webm|ogg|mov|m4v)$/i.test(mainMedia.split('?')[0].split('#')[0])
              const displayName = post.user?.username || post.user?.full_name || 'Utilisateur'

              return (
                <div
                  key={post.id}
                  className="swipe-card"
                  onClick={() => handlePostClick(post)}
                >
                  <div className="swipe-card-title-top">
                    <span className="swipe-card-title-text">{post.title}</span>
                  </div>

                  <div className={`swipe-card-image-wrapper ${post.is_urgent ? 'swipe-card-urgent' : ''}`}>
                    {mainMedia ? (
                      isVideo ? (
                        <InlineVideoPreview src={mainMedia} className="swipe-card-image" />
                      ) : (
                        <img
                          src={mainMedia}
                          alt={post.title}
                          className="swipe-card-image"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <CategoryPlaceholderMedia
                        className="swipe-card-image-placeholder"
                        categorySlug={post.category?.slug}
                      />
                    )}

                    {mainMedia && post.category && (
                      <div className="swipe-card-category">
                        {post.category.name}
                      </div>
                    )}

                    <div className="swipe-card-like">
                      <Heart size={16} fill="currentColor" />
                    </div>

                    <div className="swipe-card-overlay">
                      <div
                        className="swipe-card-profile"
                        onClick={(e) => handleProfileClick(e, post.user_id)}
                      >
                        <div className="swipe-card-avatar">
                          {post.user?.avatar_url ? (
                            <img
                              src={post.user.avatar_url}
                              alt={displayName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                              }}
                            />
                          ) : (
                            <div className="swipe-card-avatar-placeholder">
                              {(displayName[0] || 'U').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="swipe-card-profile-name">{displayName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div
          className="swipe-filter-modal-overlay"
          onClick={() => setIsFilterOpen(false)}
        >
          <div className="swipe-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="swipe-filter-modal-header">
              <h2>Filtrer</h2>
              <button
                type="button"
                className="swipe-filter-close"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Type d'annonce</p>
              <div className="swipe-filter-options">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('all')}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'offer' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('offer')}
                >
                  Demande
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingListingTypeFilter === 'request' ? 'active' : ''}`}
                  onClick={() => setPendingListingTypeFilter('request')}
                >
                  Offre
                </button>
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Moyen de paiement</p>
              <div className="swipe-filter-options swipe-filter-options-scroll">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingPaymentTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingPaymentTypeFilter('all')}
                >
                  Tous
                </button>
                {PAYMENT_OPTIONS_CONFIG.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`swipe-filter-option ${pendingPaymentTypeFilter === option.id ? 'active' : ''}`}
                    onClick={() => setPendingPaymentTypeFilter(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Trier par date</p>
              <div className="swipe-filter-options">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingSortOrder === 'desc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('desc')}
                >
                  Plus récentes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingSortOrder === 'asc' ? 'active' : ''}`}
                  onClick={() => setPendingSortOrder('asc')}
                >
                  Plus anciennes
                </button>
              </div>
            </div>
            <div className="swipe-filter-section">
              <p className="swipe-filter-section-title">Période</p>
              <div className="swipe-filter-options swipe-filter-options-scroll">
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('all')}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '1d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('1d')}
                >
                  1 jour
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2d')}
                >
                  2 jours
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '7d' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('7d')}
                >
                  7 jours
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2w' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2w')}
                >
                  2 semaines
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '3w' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('3w')}
                >
                  3 semaines
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '1m' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('1m')}
                >
                  1 mois
                </button>
                <button
                  type="button"
                  className={`swipe-filter-option ${pendingDateFilter === '2m' ? 'active' : ''}`}
                  onClick={() => setPendingDateFilter('2m')}
                >
                  2 mois
                </button>
              </div>
            </div>
            <button
              type="button"
              className="swipe-filter-apply"
              onClick={() => {
                setSortOrder(pendingSortOrder)
                setDateFilter(pendingDateFilter)
                setListingTypeFilter(pendingListingTypeFilter)
                setPaymentTypeFilter(pendingPaymentTypeFilter)
                setIsFilterOpen(false)
              }}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentPosts
