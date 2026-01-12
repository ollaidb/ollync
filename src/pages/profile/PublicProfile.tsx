import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share, MapPin, Plus, Instagram, Facebook, Star, MoreHorizontal, AlertTriangle, Flag, DollarSign, RefreshCw, ChevronDown, ChevronUp, Linkedin, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import BackButton from '../../components/BackButton'
import { fetchPostsWithRelations } from '../../utils/fetchPostsWithRelations'
import { PhotoModal } from '../../components/ProfilePage/PhotoModal'
import { EmptyState } from '../../components/EmptyState'
import PostCard from '../../components/PostCard'
import { useToastContext } from '../../contexts/ToastContext'
import './PublicProfile.css'

interface Service {
  name: string
  description: string
  payment_type: 'price' | 'exchange'
  value: string
}

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
  services?: Service[] | string[] // Peut être un tableau d'objets ou de strings (compatibilité)
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
  const { showSuccess } = useToastContext()
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
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set())

  const profileId = userId || user?.id

  // Log pour déboguer l'affichage du bouton
  useEffect(() => {
    console.log('🔍 PublicProfile Debug:', {
      userId,
      isOwnProfile,
      'user?.id': user?.id,
      profileId,
      shouldShowEditButton: isOwnProfile || !userId || userId === user?.id || profileId === user?.id
    })
  }, [userId, isOwnProfile, user?.id, profileId])

  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false)
      return
    }

    setLoading(true)
    console.log('🔍 Récupération du profil pour:', profileId)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profil non trouvé dans la base de données, tentative de création...')
          
          if (user && user.id === profileId) {
            // Créer le profil avec les données de auth.users
            const profileData = {
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              username: user.user_metadata?.username || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            }
            
            console.log('📝 Création du profil avec les données:', profileData)
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newProfile, error: createError } = await (supabase.from('profiles') as any)
              .insert(profileData)
              .select()
              .single()

            if (createError) {
              console.error('❌ Erreur lors de la création du profil:', createError)
              // Créer un profil minimal pour l'affichage
              setProfile({
                id: user.id,
                username: user.user_metadata?.username || null,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                bio: null,
                location: null,
                created_at: new Date().toISOString()
              })
            } else if (newProfile) {
              console.log('✅ Profil créé avec succès:', newProfile)
              setProfile(newProfile as ProfileData)
              setLoading(false)
              return
            }
          } else {
            console.warn('⚠️ Impossible de créer le profil : utilisateur non connecté ou ID différent')
            setProfile(null)
          }
        } else {
          console.error('❌ Erreur lors de la récupération du profil:', error)
          setProfile(null)
        }
      } else if (data) {
        console.log('✅ Profil récupéré avec succès:', data)
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
        
        // Parser les services - version simplifiée et robuste
        console.log('🔍 Format des services avant parsing:', typeof profileData.services, profileData.services)
        
        if (profileData.services) {
          let parsedServices: unknown = profileData.services
          
          console.log('🔍 Format des services avant parsing:', typeof parsedServices, parsedServices)
          
          // Si c'est une string JSON, la parser
          if (typeof parsedServices === 'string') {
            try {
              parsedServices = JSON.parse(parsedServices)
              console.log('  → Après premier parsing:', typeof parsedServices, parsedServices)
              // Si le résultat est encore une string, parser une deuxième fois
              if (typeof parsedServices === 'string') {
                try {
                  parsedServices = JSON.parse(parsedServices)
                  console.log('  → Après deuxième parsing:', typeof parsedServices, parsedServices)
                } catch (e2) {
                  console.error('Erreur parsing services (double):', e2)
                  parsedServices = []
                }
              }
            } catch (e) {
              console.error('Erreur parsing services:', e)
              parsedServices = []
            }
          }
          
          // Normaliser en tableau d'objets Service
          if (Array.isArray(parsedServices)) {
            console.log(`📦 Nombre de services trouvés dans la base: ${parsedServices.length}`)
            console.log(`📦 Type du premier service:`, typeof parsedServices[0], parsedServices[0])
            
            profileData.services = parsedServices.map((service: unknown, index: number): Service | null => {
              console.log(`🔍 Traitement service ${index}:`, typeof service, service)
              
              // Fonction récursive pour parser les strings JSON (peut être doublement échappées)
              const parseJsonRecursive = (val: unknown, depth = 0): unknown => {
                if (depth > 5) {
                  console.warn(`  ⚠️ Limite de récursion atteinte pour:`, val)
                  return val // Limite de récursion
                }
                
                if (typeof val === 'string') {
                  const trimmed = val.trim()
                  // Si ça ressemble à du JSON, essayer de le parser
                  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
                      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
                    try {
                      const parsed = JSON.parse(trimmed)
                      // Si c'est encore une string, réessayer
                      if (typeof parsed === 'string') {
                        return parseJsonRecursive(parsed, depth + 1)
                      }
                      return parsed
                    } catch (e) {
                      // Ce n'est pas du JSON valide, retourner la string
                      return trimmed
                    }
                  }
                  return trimmed
                }
                return val
              }
              
              // Fonction pour extraire une valeur textuelle d'un service
              const extractValue = (val: unknown): string => {
                if (val === null || val === undefined) return ''
                
                // Si c'est déjà une string simple, la retourner
                if (typeof val === 'string') {
                  const trimmed = val.trim()
                  // Si ça ressemble à du JSON, essayer de le parser
                  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
                    const parsed = parseJsonRecursive(val)
                    if (typeof parsed === 'string') return parsed.trim()
                    if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
                      return String((parsed as { name?: unknown }).name || '').trim()
                    }
                    return String(parsed).trim()
                  }
                  return trimmed
                }
                
                // Si c'est un objet, essayer d'extraire une valeur
                if (typeof val === 'object' && val !== null) {
                  if ('name' in val && typeof (val as { name?: unknown }).name === 'string') {
                    return (val as { name: string }).name.trim()
                  }
                  return String(val)
                }
                
                return String(val).trim()
              }
              
              // Si c'est une string, essayer de la parser d'abord
              if (typeof service === 'string') {
                const parsedService = parseJsonRecursive(service)
                console.log(`  → Après parsing récursif:`, typeof parsedService, parsedService)
                
                // Si après parsing c'est un objet avec name, l'utiliser
                if (parsedService && typeof parsedService === 'object' && parsedService !== null && 'name' in parsedService) {
                  const serviceObj = parsedService as Record<string, unknown>
                  const name = extractValue(serviceObj.name)
                  const description = extractValue(serviceObj.description)
                  const value = extractValue(serviceObj.value)
                  const payment_type = serviceObj.payment_type === 'exchange' ? 'exchange' : 'price'
                  
                  if (!name || name.startsWith('{') || name.startsWith('[')) {
                    console.warn(`  ⚠️ Service ${index} ignoré (name invalide après parsing):`, name)
                    return null
                  }
                  
                  console.log(`  ✅ Service ${index} parsé depuis string:`, { name, description, payment_type, value })
                  return {
                    name: name.trim(),
                    description: description.trim(),
                    payment_type: payment_type as 'price' | 'exchange',
                    value: value.trim()
                  }
                }
                
                // Si c'est toujours une string après parsing, c'est juste un nom
                if (typeof parsedService === 'string' && parsedService.trim()) {
                  console.log(`  ✅ Service ${index} (nom simple):`, parsedService)
                  return {
                    name: parsedService.trim(),
                    description: '',
                    payment_type: 'price' as const,
                    value: ''
                  }
                }
              }
              
              // Si c'est déjà un objet Service valide, l'utiliser directement
              if (service && typeof service === 'object' && service !== null) {
                const serviceObj = service as Record<string, unknown>
                
                // Vérifier si c'est un objet avec des propriétés de service
                if ('name' in serviceObj || 'description' in serviceObj || 'payment_type' in serviceObj) {
                  const name = extractValue(serviceObj.name)
                  const description = extractValue(serviceObj.description)
                  const value = extractValue(serviceObj.value)
                  const payment_type = serviceObj.payment_type === 'exchange' ? 'exchange' : 'price'
                  
                  // Ne pas filtrer si le name est vide - on peut avoir un service sans nom
                  // Mais on filtre si c'est du JSON brut
                  if (name && (name.startsWith('{') || name.startsWith('['))) {
                    console.warn(`  ⚠️ Service ${index} ignoré (name est du JSON brut):`, name)
                    return null
                  }
                  
                  // Si pas de nom mais qu'on a une description ou une valeur, créer un service avec un nom par défaut
                  const finalName = name || `Service ${index + 1}`
                  
                  console.log(`  ✅ Service ${index} (objet direct):`, { name: finalName, description, payment_type, value })
                  return {
                    name: finalName.trim(),
                    description: description.trim(),
                    payment_type: payment_type as 'price' | 'exchange',
                    value: value.trim()
                  }
                }
              }
              
              console.warn(`  ⚠️ Service ${index} ignoré (format invalide):`, service, typeof service)
              return null
            }).filter((s): s is Service => {
              // Filtrer uniquement les services vraiment invalides
              const isValid = s !== null && s.name !== '' && !s.name.startsWith('{') && !s.name.startsWith('[')
              if (!isValid) {
                console.warn(`  🗑️ Service filtré:`, s)
              }
              return isValid
            })
            
            console.log(`✅ Services normalisés: ${profileData.services.length} services valides sur ${parsedServices.length} trouvés`)
          } else {
            console.warn('⚠️ Services n\'est pas un tableau:', parsedServices)
            profileData.services = []
          }
        } else {
          console.log('ℹ️ Aucun service dans le profil')
          profileData.services = []
        }
        
        // Debug final
        const servicesCount = profileData.services?.length || 0
        console.log(`✅ Services finaux après parsing: ${servicesCount} services`)
        if (servicesCount > 0) {
          console.log('📋 Détail des services finaux:', profileData.services)
        }
        
        setProfile(profileData)
      } else {
        console.warn('⚠️ Aucune donnée retournée')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
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
        showSuccess('Ajouté dans favoris')
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('reports') as any)
        .insert({
          reporter_id: user.id,
          reported_user_id: profileId,
          reported_post_id: reportType === 'post' ? selectedPostId : null,
          report_type: reportType === 'post' ? 'post' : 'profile',
          report_reason: reportReason,
          report_category: reportType,
          description: null
        })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, user, isOwnProfile])

  useEffect(() => {
    if (profileId && activeTab === 'annonces') {
      fetchPosts()
    } else if (profileId && activeTab === 'avis') {
      fetchReviews()
    }
    // Pour "à propos", pas besoin de fetch, les données sont déjà dans profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, activeTab])

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

  // Centres d'intérêt (uniquement skills, pas les services)
  const interests = profile.skills || []

  // Services (objets avec name, description, payment_type, value)
  // Les services sont déjà parsés dans fetchProfile, on les utilise directement
  const services: Service[] = (() => {
    if (!profile.services || profile.services.length === 0) {
      console.log('ℹ️ Aucun service dans le profil pour l\'affichage')
      return []
    }
    
    console.log(`📋 Services à afficher: ${profile.services.length}`, profile.services)
    
    // Fonction pour nettoyer une valeur et extraire uniquement le texte
    const cleanValue = (val: unknown): string => {
      if (val === null || val === undefined) return ''
      
      // Si c'est déjà une string, vérifier si c'est du JSON
      if (typeof val === 'string') {
        // Si ça ressemble à du JSON, essayer de le parser
        const trimmed = val.trim()
        if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
          try {
            const parsed = JSON.parse(trimmed)
            // Si c'est un objet, extraire les valeurs textuelles
            if (parsed && typeof parsed === 'object') {
              // Si c'est un objet service, extraire name, description, value
              if ('name' in parsed) {
                return String(parsed.name || '')
              }
              // Sinon, ne pas afficher l'objet JSON
              return ''
            }
            return String(parsed)
          } catch (e) {
            // Ce n'est pas du JSON valide, retourner tel quel
            return trimmed
          }
        }
        return trimmed
      }
      
      // Si c'est un objet, extraire les valeurs
      if (typeof val === 'object') {
        // Si c'est un objet avec name, utiliser name
        if ('name' in val) {
          return cleanValue((val as { name: unknown }).name)
        }
        // Sinon, ne pas afficher l'objet
        return ''
      }
      
      return String(val).trim()
    }
    
    // S'assurer que chaque service a les bonnes propriétés et valeurs nettoyées
    const cleanedServices = (profile.services as Service[]).map((service, index) => {
      const cleanedName = cleanValue(service.name)
      const cleanedDescription = cleanValue(service.description)
      const cleanedValue = cleanValue(service.value)
      
      console.log(`🧹 Service ${index} nettoyé:`, {
        name: cleanedName,
        description: cleanedDescription,
        value: cleanedValue,
        payment_type: service.payment_type
      })
      
      return {
        name: cleanedName,
        description: cleanedDescription,
        payment_type: (service.payment_type === 'exchange' ? 'exchange' : 'price') as 'price' | 'exchange',
        value: cleanedValue
      }
    }).filter(s => {
      const isValid = s.name !== '' && !s.name.startsWith('{') && !s.name.startsWith('[')
      if (!isValid) {
        console.warn('⚠️ Service filtré (invalide):', s)
      }
      return isValid
    })
    
    console.log(`✅ Services finaux à afficher: ${cleanedServices.length} sur ${profile.services?.length || 0} récupérés`)
    if (cleanedServices.length !== (profile.services?.length || 0)) {
      console.warn(`⚠️ Certains services ont été filtrés: ${(profile.services?.length || 0) - cleanedServices.length} services invalides`)
    }
    return cleanedServices
  })()

  // Toggle l'expansion d'un service
  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="public-profile-page">
      {/* 1. HEADER - Retour + Menu actions */}
      <div className="profile-page-header">
        <BackButton className="profile-back-button" />
        <div className="profile-header-spacer"></div>
        <div className="profile-header-actions">
          {!(isOwnProfile || !userId || (user && (userId === user.id || profileId === user.id))) && (
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
          {(isOwnProfile || !userId || (user && (userId === user.id || profileId === user.id))) && (
            <button
              className="profile-edit-text-btn"
              onClick={() => navigate('/profile/edit')}
              aria-label="Modifier le profil"
            >
              modifier le profil
            </button>
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

      {/* 3. MENU SECONDAIRE : À propos / Annonce / Avis / Bouton édition */}
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

            {/* RÉSEAUX SOCIAUX - Icônes indépendantes */}
            {profile.social_links && (
              (profile.social_links.instagram || profile.social_links.tiktok || profile.social_links.linkedin || profile.social_links.twitter || profile.social_links.facebook || profile.social_links.website) && (
                <div className="profile-social-icons">
                  {profile.social_links.instagram && (
                    <a
                      href={profile.social_links.instagram.startsWith('http') ? profile.social_links.instagram : `https://instagram.com/${profile.social_links.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="Instagram"
                    >
                      <Instagram size={24} />
                    </a>
                  )}
                  {profile.social_links.tiktok && (
                    <a
                      href={profile.social_links.tiktok.startsWith('http') ? profile.social_links.tiktok : `https://tiktok.com/@${profile.social_links.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="TikTok"
                    >
                      <div className="tiktok-icon-small">TT</div>
                    </a>
                  )}
                  {profile.social_links.linkedin && (
                    <a
                      href={profile.social_links.linkedin.startsWith('http') ? profile.social_links.linkedin : `https://linkedin.com/in/${profile.social_links.linkedin.replace('@', '').replace(/^\/+/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={24} />
                    </a>
                  )}
                  {profile.social_links.twitter && (
                    <a
                      href={profile.social_links.twitter.startsWith('http') ? profile.social_links.twitter : `https://twitter.com/${profile.social_links.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="Twitter/X"
                    >
                      <Globe size={24} />
                    </a>
                  )}
                  {profile.social_links.facebook && (
                    <a
                      href={profile.social_links.facebook.startsWith('http') ? profile.social_links.facebook : `https://facebook.com/${profile.social_links.facebook.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="Facebook"
                    >
                      <Facebook size={24} />
                    </a>
                  )}
                  {profile.social_links.website && (
                    <a
                      href={profile.social_links.website.startsWith('http') ? profile.social_links.website : `https://${profile.social_links.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon-independent"
                      aria-label="Site web"
                    >
                      <Globe size={24} />
                    </a>
                  )}
                </div>
              )
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

            {/* SERVICES */}
            {services.length > 0 && (
              <div className="profile-services-section">
                <h3 className="services-title">services</h3>
                <div className="services-list-container">
                  {(() => {
                    const validServices = services.filter((service) => {
                      // Filtrer les services invalides
                      const name = String(service.name || '').trim()
                      const isValid = name && !name.startsWith('{') && !name.startsWith('[') && name !== ''
                      if (!isValid) {
                        console.warn(`🗑️ Service filtré à l'affichage:`, service)
                      }
                      return isValid
                    })
                    
                    console.log(`📊 Affichage de ${validServices.length} services valides sur ${services.length} services au total`)
                    
                    return validServices.map((service, filteredIndex) => {
                      // Utiliser un index unique basé sur le nom du service pour éviter les conflits
                      const serviceKey = `${service.name}-${filteredIndex}`
                    // S'assurer que les valeurs sont bien des strings propres
                    const serviceName = String(service.name || '').trim()
                    const serviceDescription = service.description ? String(service.description).trim() : ''
                    const serviceValue = service.value ? String(service.value).trim() : ''
                    
                    // Trouver l'index original dans le tableau services pour l'expansion
                    const originalIndex = services.findIndex(s => s === service)
                    const isExpanded = expandedServices.has(originalIndex)
                    const hasLongDescription = serviceDescription && serviceDescription.length > 100
                    const displayDescription = isExpanded 
                      ? serviceDescription 
                      : (serviceDescription?.substring(0, 100) || '')
                    
                    return (
                      <div key={serviceKey} className="service-block">
                        <div className="service-block-header">
                          <h4 className="service-block-title">{serviceName}</h4>
                          <div className="service-block-payment">
                            {service.payment_type === 'price' && serviceValue && (
                              <div className="service-block-price">
                                <DollarSign size={16} />
                                <span>{serviceValue}</span>
                              </div>
                            )}
                            {service.payment_type === 'exchange' && (
                              <div className="service-block-exchange-badge">
                                <RefreshCw size={16} />
                                <span>Échange</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {serviceDescription && (
                          <div className="service-block-description-section">
                            <p className="service-block-description-text">
                              {displayDescription}{!isExpanded && hasLongDescription && '...'}
                            </p>
                            {hasLongDescription && (
                              <button
                                className="service-read-more-btn"
                                onClick={() => toggleServiceExpansion(originalIndex)}
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Lire moins</span>
                                    <ChevronUp size={14} />
                                  </>
                                ) : (
                                  <>
                                    <span>Lire plus</span>
                                    <ChevronDown size={14} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {isExpanded && service.payment_type === 'exchange' && serviceValue && (
                          <div className="service-block-exchange-details">
                            <p className="service-exchange-label">Échange proposé :</p>
                            <p className="service-exchange-value">{serviceValue}</p>
                          </div>
                        )}
                      </div>
                    )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode Annonce - Liste avec photo à gauche */}
        {activeTab === 'annonces' && (
          <div className="profile-content-annonces">
            {postsLoading ? (
              <div className="loading-state">Chargement...</div>
            ) : posts.length === 0 ? (
              <EmptyState type="posts" />
            ) : (
              <div className="profile-posts-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode="list" hideProfile={true} />
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
