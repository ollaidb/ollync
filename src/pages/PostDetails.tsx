import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Heart, Share, MapPin, Check, X, Navigation, ImageOff, Plus, ChevronRight, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'
import BackButton from '../components/BackButton'
import { useAuth } from '../hooks/useSupabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { fetchPostsWithRelations } from '../utils/fetchPostsWithRelations'
import { mapPost, type MappedPost } from '../utils/postMapper'
import { GoogleMapComponent } from '../components/Maps/GoogleMap'
import ConfirmationModal from '../components/ConfirmationModal'
import { useToastContext } from '../contexts/ToastContext'
import { useNavigationHistory } from '../hooks/useNavigationHistory'
import './PostDetails.css'

interface Post {
  id: string
  title: string
  description: string
  price?: number | null
  location?: string | null
  location_lat?: number | null
  location_lng?: number | null
  location_address?: string | null
  images?: string[] | null
  video?: string | null
  likes_count: number
  comments_count: number
  created_at: string
  needed_date?: string | null
  needed_time?: string | null
  number_of_people?: number | null
  duration_minutes?: number | null
  profile_level?: string | null
  profile_roles?: string[] | string | null
  opening_hours?: Array<{
    day: string
    enabled: boolean
    start: string
    end: string
  }> | string | null
  billing_hours?: number | null
  delivery_available: boolean
  is_urgent?: boolean
  status: string
  listing_type?: 'offer' | 'request' | string | null
  user_id: string
  payment_type?: string | null
  media_type?: string | null
  external_link?: string | null
  document_url?: string | null
  tagged_post_id?: string | null
  contract_type?: string | null
  work_schedule?: string | null
  responsibilities?: string | null
  required_skills?: string | null
  benefits?: string | null
  user?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    bio?: string | null
  } | null
  category?: {
    name: string
    slug: string
  } | null
  sub_category?: {
    name: string
    slug: string
  } | null
}

interface Application {
  id: string
  applicant_id: string
  status: string
  message?: string | null
  created_at: string
  applicant?: {
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

type ContactIntent = 'request' | 'apply' | 'buy' | 'reserve' | 'ticket'

const EMPLOI_CATEGORY_SLUGS = new Set(['emploi'])
const LIEU_CATEGORY_SLUGS = new Set(['studio-lieu', 'lieu'])
const VENTE_CATEGORY_SLUGS = new Set(['vente'])
const EVENEMENT_CATEGORY_SLUGS = new Set(['evenements', 'evenement'])

const getContactIntent = (slug?: string | null): ContactIntent => {
  const normalized = (slug || '').trim().toLowerCase()
  if (EMPLOI_CATEGORY_SLUGS.has(normalized)) return 'apply'
  if (LIEU_CATEGORY_SLUGS.has(normalized)) return 'reserve'
  if (VENTE_CATEGORY_SLUGS.has(normalized)) return 'buy'
  if (EVENEMENT_CATEGORY_SLUGS.has(normalized)) return 'ticket'
  return 'request'
}

const PostDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { getPreviousPath, markNavigatingBack, canGoBack, history } = useNavigationHistory()
  const isMobile = useIsMobile()
  const { showSuccess } = useToastContext()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRestricted, setIsRestricted] = useState(false)
  const [liked, setLiked] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [matchRequest, setMatchRequest] = useState<{
    id: string
    status: string
  } | null>(null)
  const [showSendRequestModal, setShowSendRequestModal] = useState(false)
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestRole, setRequestRole] = useState('')
  const [requestCvDocument, setRequestCvDocument] = useState<File | null>(null)
  const [requestCvDocumentName, setRequestCvDocumentName] = useState<string>('')
  const [requestCoverLetterDocument, setRequestCoverLetterDocument] = useState<File | null>(null)
  const [requestCoverLetterDocumentName, setRequestCoverLetterDocumentName] = useState<string>('')
  const [reservationDate, setReservationDate] = useState('')
  const [reservationTime, setReservationTime] = useState('')
  const [reservationDurationMinutes, setReservationDurationMinutes] = useState<number>(60)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [viewerTouchStart, setViewerTouchStart] = useState<number | null>(null)
  const [viewerTouchEnd, setViewerTouchEnd] = useState<number | null>(null)
  const [viewerDidSwipe, setViewerDidSwipe] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<Array<{
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
  }>>([])
  const [taggedPost, setTaggedPost] = useState<MappedPost | null>(null)
  const [authorPostCount, setAuthorPostCount] = useState<number | null>(null)
  const maxPostsPerSection = isMobile ? 5 : 4
  const currentPath = `${location.pathname}${location.search}`
  const navState = (location.state || {}) as { originPath?: string }

  const findNonPostOriginPath = () => {
    const previousEntries = [...history].slice(0, -1).reverse()
    const firstNonPost = previousEntries.find((entry) => !entry.startsWith('/post/'))
    return firstNonPost || '/home'
  }

  const getOriginPath = () => {
    if (navState.originPath) return navState.originPath
    const previousPath = getPreviousPath()
    if (previousPath && !previousPath.startsWith('/post/')) return previousPath
    return findNonPostOriginPath()
  }

  const handleBackFromPost = () => {
    const originPath = getOriginPath()
    if (originPath && originPath !== currentPath) {
      markNavigatingBack()
      navigate(originPath)
      return
    }

    const previousPath = getPreviousPath()
    if (canGoBack() && previousPath && previousPath !== currentPath) {
      markNavigatingBack()
      navigate(previousPath)
      return
    }

    markNavigatingBack()
    navigate('/home')
  }

  const recommendedPostsFull = useMemo(() => {
    const list: Array<any> = []
    if (taggedPost) list.push(taggedPost)
    relatedPosts.forEach((postItem) => {
      if (!taggedPost || postItem.id !== taggedPost.id) {
        list.push(postItem)
      }
    })
    return list
  }, [taggedPost, relatedPosts])
  const recommendedPosts = recommendedPostsFull.slice(0, maxPostsPerSection)

  useEffect(() => {
    if (id) {
      fetchPost()
      if (user) {
        checkLiked()
        fetchApplications()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  useEffect(() => {
    if (post) {
      fetchRelatedPosts()
      if (user) {
        checkMatchRequest()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, user?.id])

  // Réinitialiser l'index quand les médias changent
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [post?.images, post?.video])

  const fetchPost = async () => {
    if (!id) return

    try {
      // 1. Récupérer le post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postError) {
        console.error('Error fetching post:', postError)
        setLoading(false)
        return
      }

      if (!postData) {
        setLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const post = postData as any

      if (post.status !== 'active' && post.user_id !== user?.id) {
        setPost(null)
        setIsRestricted(true)
        setLoading(false)
        return
      }

      // 2. Récupérer le profil de l'utilisateur
      let userProfile = null
      if (post.user_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .eq('id', post.user_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (profileData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = profileData as any
          userProfile = {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio
          }
        }
      }

      // 3. Récupérer la catégorie
      let categoryData = null
      if (post.category_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('id', post.category_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (catData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const category = catData as any
          categoryData = {
            name: category.name,
            slug: category.slug
          }
        }
      }

      // 4. Récupérer l'annonce taguée (optionnel)
      if (post.tagged_post_id) {
        try {
          const { data: taggedData, error: taggedError } = await supabase
            .from('posts')
            .select(`
              id,
              title,
              description,
              price,
              location,
              images,
              likes_count,
              comments_count,
              created_at,
              needed_date,
              number_of_people,
              delivery_available,
              is_urgent,
              user_id,
              category_id,
              sub_category_id,
              profiles (username, full_name, avatar_url),
              categories (name, slug)
            `)
            .eq('id', post.tagged_post_id)
            .single()

          if (!taggedError && taggedData) {
            setTaggedPost(mapPost(taggedData as any))
          } else {
            setTaggedPost(null)
          }
        } catch (taggedFetchError) {
          console.error('Error fetching tagged post:', taggedFetchError)
          setTaggedPost(null)
        }
      } else {
        setTaggedPost(null)
      }

      // 4. Récupérer la sous-catégorie
      let subCategoryData = null
      if (post.sub_category_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subCatData } = await supabase
          .from('sub_categories')
          .select('id, name, slug')
          .eq('id', post.sub_category_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (subCatData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subCategory = subCatData as any
          subCategoryData = {
            name: subCategory.name,
            slug: subCategory.slug
          }
        }
      }

      // 5. Combiner les données
      setIsRestricted(false)
      setPost({
        ...post,
        user: userProfile,
        category: categoryData,
        sub_category: subCategoryData
      } as Post)

      if (post.user_id) {
        await fetchAuthorPostCount(post.user_id)
      }

      // 6. Incrémenter les vues
      const currentViews = post.views_count || 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('posts') as any).update({ views_count: currentViews + 1 }).eq('id', id)
    } catch (error) {
      console.error('Error in fetchPost:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthorPostCount = async (authorId: string) => {
    try {
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authorId)
        .eq('status', 'active')
      setAuthorPostCount(count ?? 0)
    } catch (error) {
      console.error('Error fetching author post count:', error)
      setAuthorPostCount(null)
    }
  }

  const checkLiked = async () => {
    if (!user || !id) {
      setLiked(false)
      return
    }

    try {
      // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs 406
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .maybeSingle()

      // Si erreur ou pas de données, le post n'est pas liké
      if (error || !data) {
        setLiked(false)
      } else {
        setLiked(true)
      }
    } catch (error) {
      // Si aucune donnée n'est trouvée, le post n'est pas liké
      console.error('Error checking like:', error)
      setLiked(false)
    }
  }

  const handleLike = async () => {
    if (!user || !id) {
      navigate('/auth/login')
      return
    }

    // Vérifier que l'utilisateur a un profil dans la base de données
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profil utilisateur introuvable:', profileError)
        alert('Votre profil n\'existe pas dans la base de données. Veuillez vous reconnecter ou contacter le support.')
        return
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du profil:', error)
      alert('Erreur lors de la vérification de votre profil. Veuillez réessayer.')
      return
    }

    try {
      if (liked) {
        // Supprimer le like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id)

        if (error) {
          console.error('Error removing like:', error)
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          alert(`Erreur lors de la suppression du like: ${error.message}`)
          return
        }

        setLiked(false)
        if (post) {
          const newLikesCount = Math.max(0, post.likes_count - 1)
          setPost({ ...post, likes_count: newLikesCount })
          
          // Mettre à jour le compteur dans la base de données
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('posts') as any).update({ likes_count: newLikesCount }).eq('id', id)
        }
        
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('likeChanged', { 
          detail: { postId: id, liked: false } 
        }))
      } else {
        // Ajouter le like
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('likes') as any)
          .insert({ user_id: user.id, post_id: id })
          .select()
          .single()

        if (error) {
          console.error('Error adding like:', error)
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          alert(`Erreur lors de l'ajout du like: ${error.message}`)
          return
        }

        if (data) {
          setLiked(true)
          if (post) {
            const newLikesCount = post.likes_count + 1
            setPost({ ...post, likes_count: newLikesCount })
            
            // Mettre à jour le compteur dans la base de données
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('posts') as any).update({ likes_count: newLikesCount }).eq('id', id)
          }
          
          // Afficher le toast de confirmation
          showSuccess('Liké')
          
          // Déclencher un événement personnalisé pour notifier les autres composants
          window.dispatchEvent(new CustomEvent('likeChanged', { 
            detail: { postId: id, liked: true } 
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.description,
          url: window.location.href
        })
      } catch (error) {
        // L'utilisateur a peut-être annulé, ce n'est pas une erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Lien copié dans le presse-papier')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Impossible de copier le lien')
      }
    }
  }

  const checkMatchRequest = async () => {
    if (!user || !id || !post) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('match_requests') as any)
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('related_post_id', id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking match request:', error)
        return
      }

      if (data) {
        setMatchRequest({ id: data.id, status: data.status })
      } else {
        setMatchRequest(null)
      }
    } catch (error) {
      console.error('Error checking match request:', error)
    }
  }

  const handleApply = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }

    // Si la demande est acceptée, ne rien faire
    if (matchRequest && matchRequest.status === 'accepted') {
      return
    }

    // Si une demande est déjà envoyée, afficher la modal d'annulation
    if (matchRequest && matchRequest.status === 'pending') {
      setShowCancelRequestModal(true)
      return
    }

    // Sinon, afficher la modal d'envoi de demande
    const reviewerName = post?.user?.full_name || post?.user?.username || ''
    const greeting = reviewerName ? `Bonjour ${reviewerName},` : 'Bonjour,'
    setRequestMessage(`${greeting} votre annonce m'intéresse ! Est-elle toujours disponible ?`)
    setRequestRole('')
    setRequestCvDocument(null)
    setRequestCvDocumentName('')
    setRequestCoverLetterDocument(null)
    setRequestCoverLetterDocumentName('')
    setReservationDate(post?.needed_date || '')
    setReservationTime(post?.needed_time || '')
    setReservationDurationMinutes(post?.duration_minutes && post.duration_minutes > 0 ? post.duration_minutes : 60)
    setShowSendRequestModal(true)
  }

  const validateRequestFile = (file: File) => {
    const allowedExtensions = ['pdf', 'doc', 'docx']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!allowedExtensions.includes(ext)) {
      throw new Error('Format non supporté. Utilisez PDF, DOC ou DOCX.')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier ne doit pas dépasser 10MB.')
    }
  }

  const uploadRequestFile = async (file: File, kind: 'cv' | 'cover_letter') => {
    validateRequestFile(file)
    const safeName = file.name.replace(/\s+/g, '_')
    const fileName = `${user?.id}/${Date.now()}_${kind}_${safeName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('match_request_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError || !uploadData) {
      throw new Error(uploadError?.message || 'Erreur lors de l’upload du document.')
    }

    const { data: publicUrlData } = supabase.storage
      .from('match_request_documents')
      .getPublicUrl(uploadData.path)

    return {
      url: publicUrlData?.publicUrl || null,
      name: file.name
    }
  }

  const hasAvailableSpots = async () => {
    if (!id || !post?.number_of_people || post.number_of_people <= 0) return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from('match_requests') as any)
      .select('id', { count: 'exact', head: true })
      .eq('related_post_id', id)
      .in('status', ['pending', 'accepted'])
      .in('request_intent', ['reserve', 'ticket'])

    if (error) {
      console.error('Error checking availability:', error)
      return true
    }

    const reservedCount = Number(count || 0)
    return reservedCount < post.number_of_people
  }

  const createTicketForCurrentUser = async () => {
    if (!user || !post) return
    const baseDate = reservationDate || post.needed_date || new Date().toISOString().slice(0, 10)
    const baseTime = reservationTime || post.needed_time || '10:00'
    const eventDate = `${baseDate}T${baseTime}:00`
    const now = new Date()
    const ticketDate = new Date(eventDate)
    const status = ticketDate.getTime() < now.getTime() ? 'past' : 'upcoming'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('event_tickets') as any).insert({
      user_id: user.id,
      title: contactIntent === 'ticket' ? `Billet - ${post.title}` : `Réservation - ${post.title}`,
      event_date: ticketDate.toISOString(),
      location: post.location || null,
      status
    })
  }

  const handleSendRequest = async () => {
    if (!user || !id || !post) return

    const availableRoles = isEmploiRequestPost ? [] : getProfileRolesList(post.profile_roles)
    if (availableRoles.length > 0 && !requestRole.trim()) {
      alert('Veuillez choisir le poste pour lequel vous postulez.')
      return
    }

    if (contactIntent === 'apply' && !requestCvDocument) {
      alert('Le CV est obligatoire pour postuler.')
      return
    }

    if (contactIntent === 'reserve') {
      if (!reservationDate || !reservationTime) {
        alert('Choisissez une date et une heure pour réserver.')
        return
      }
      if (!reservationDurationMinutes || reservationDurationMinutes <= 0) {
        alert('Indiquez une durée valide.')
        return
      }
    }

    if (contactIntent === 'ticket' || contactIntent === 'reserve') {
      const hasSpots = await hasAvailableSpots()
      if (!hasSpots) {
        alert('Il n’y a plus de place disponible pour cette annonce.')
        return
      }
    }

    setLoadingRequest(true)
    try {
      let cvUrl: string | null = null
      let cvName: string | null = null
      let coverLetterUrl: string | null = null
      let coverLetterName: string | null = null

      if (contactIntent === 'apply' && requestCvDocument) {
        const uploadedCv = await uploadRequestFile(requestCvDocument, 'cv')
        cvUrl = uploadedCv.url
        cvName = uploadedCv.name
      }

      if (contactIntent === 'apply' && requestCoverLetterDocument) {
        const uploadedCoverLetter = await uploadRequestFile(requestCoverLetterDocument, 'cover_letter')
        coverLetterUrl = uploadedCoverLetter.url
        coverLetterName = uploadedCoverLetter.name
      }

      const trimmedMessage = requestMessage.trim()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('match_requests') as any)
        .insert({
          from_user_id: user.id,
          to_user_id: post.user_id,
          related_post_id: id,
          status: 'pending',
          request_message: trimmedMessage.length > 0 ? trimmedMessage : null,
          request_role: requestRole.trim() || null,
          request_document_url: cvUrl,
          request_document_name: cvName,
          request_cover_letter_url: coverLetterUrl,
          request_cover_letter_name: coverLetterName,
          request_intent: contactIntent,
          reservation_date: reservationDate || null,
          reservation_time: reservationTime || null,
          reservation_duration_minutes: contactIntent === 'reserve' ? reservationDurationMinutes : null
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending match request:', error)
        alert(`Erreur lors de l'envoi de la demande: ${error.message}`)
        setLoadingRequest(false)
        return
      }

      if (data) {
        const shouldAutoValidateTicket = (contactIntent === 'ticket' || contactIntent === 'reserve') && !isPaidAction()

        if (shouldAutoValidateTicket) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('match_requests') as any)
            .update({ status: 'accepted' })
            .eq('id', data.id)
          await createTicketForCurrentUser()
          setMatchRequest({ id: data.id, status: 'accepted' })
        } else {
          setMatchRequest({ id: data.id, status: data.status })
        }

        setShowSendRequestModal(false)
        setRequestMessage('')
        setRequestRole('')
        setRequestCvDocument(null)
        setRequestCvDocumentName('')
        setRequestCoverLetterDocument(null)
        setRequestCoverLetterDocumentName('')
        setReservationDate('')
        setReservationTime('')
        setReservationDurationMinutes(60)
        showSuccess(shouldAutoValidateTicket ? 'Billet validé' : 'Demande envoyée')
      }
    } catch (error) {
      console.error('Error sending match request:', error)
      alert('Erreur lors de l\'envoi de la demande')
    } finally {
      setLoadingRequest(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!matchRequest || !user || !matchRequest.id) return

    setLoadingRequest(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('match_requests') as any)
        .update({ status: 'cancelled' })
        .eq('id', matchRequest.id)
        .eq('from_user_id', user.id)

      if (error) {
        console.error('Error cancelling match request:', error)
        alert(`Erreur lors de l'annulation: ${error.message}`)
        setLoadingRequest(false)
        return
      }

      setMatchRequest(null)
      setShowCancelRequestModal(false)
      showSuccess('Demande annulée')
    } catch (error) {
      console.error('Error cancelling match request:', error)
      alert('Erreur lors de l\'annulation de la demande')
    } finally {
      setLoadingRequest(false)
    }
  }

  const handleOpenNavigation = () => {
    if (post?.location_lat && post?.location_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${post.location_lat},${post.location_lng}`
      window.open(url, '_blank')
    }
  }

  const handleDelete = async () => {
    if (!id || !user || post?.user_id !== user.id) return

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
      navigate('/home')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Erreur lors de la suppression')
    }
  }


  const handleAcceptApplication = async (applicationId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('applications') as any)
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (error) throw error
      fetchApplications()
    } catch (error) {
      console.error('Error accepting application:', error)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('applications') as any)
        .update({ status: 'rejected' })
        .eq('id', applicationId)

      if (error) throw error
      fetchApplications()
    } catch (error) {
      console.error('Error rejecting application:', error)
    }
  }

  const fetchApplications = async () => {
    if (!id || !user || !post || post.user_id !== user.id) return

    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(username, full_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data)
  }

  const fetchRelatedPosts = async () => {
    if (!post) return

    try {
      // Récupérer des annonces de la même catégorie, excluant l'annonce actuelle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postCategoryId = (post as any).category_id
      
      if (postCategoryId) {
        const related = await fetchPostsWithRelations({
          categoryId: postCategoryId,
          status: 'active',
          limit: maxPostsPerSection * 2,
          orderBy: 'created_at',
          orderDirection: 'desc',
          excludeUserId: user?.id
        })
        // Filtrer pour exclure le post actuel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = related.filter((p: any) => p.id !== post.id)
        setRelatedPosts(filtered.slice(0, maxPostsPerSection * 2))
      } else {
        // Si pas de catégorie, récupérer les dernières annonces
        const related = await fetchPostsWithRelations({
          status: 'active',
          limit: maxPostsPerSection * 2,
          orderBy: 'created_at',
          orderDirection: 'desc',
          excludeUserId: user?.id
        })
        // Filtrer pour exclure le post actuel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = related.filter((p: any) => p.id !== post.id)
        setRelatedPosts(filtered.slice(0, maxPostsPerSection * 2))
      }
    } catch (error) {
      console.error('Error fetching related posts:', error)
    }
  }

  const isOwner = user && post && post.user_id === user.id
  const contactIntent = getContactIntent(post?.category?.slug)
  const images = post?.images || []
  const isValidMediaUrl = (value: string) => {
    const lower = value.toLowerCase()
    if (lower.includes('ton-projet.supabase.co')) return false
    if (lower.includes('ton user id')) return false
    if (lower.includes('votre_')) return false
    return /^https?:\/\//i.test(value)
  }

  const mediaItems = [post?.video, ...images].filter((item): item is string => {
    if (typeof item !== 'string') return false
    const trimmed = item.trim()
    if (!trimmed) return false
    if (trimmed === 'null' || trimmed === 'undefined') return false
    if (!isValidMediaUrl(trimmed)) return false
    return true
  })

  const getDocumentName = (url?: string | null) => {
    if (!url) return 'Document PDF'
    const [baseUrl, hash] = url.split('#')
    if (hash) {
      const params = new URLSearchParams(hash)
      const name = params.get('name')
      if (name) return name
    }
    const cleanUrl = baseUrl.split('?')[0]
    const fileName = cleanUrl.split('/').pop()
    return fileName ? decodeURIComponent(fileName) : 'Document PDF'
  }

  const getProfileRolesList = (roles?: string[] | string | null) => {
    if (!roles) return []
    if (Array.isArray(roles)) return roles.filter(Boolean)
    if (typeof roles !== 'string') return []
    const trimmed = roles.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {
      // Ignore JSON parse errors and fall back to delimiter split
    }
    return trimmed
      .split('||')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const getOpeningHoursList = (
    openingHours?: Array<{ day: string; enabled: boolean; start: string; end: string }> | string | null
  ) => {
    if (!openingHours) return []
    let parsed: Array<{ day: string; enabled: boolean; start: string; end: string }> = []

    if (Array.isArray(openingHours)) {
      parsed = openingHours
    } else if (typeof openingHours === 'string') {
      const trimmed = openingHours.trim()
      if (!trimmed) return []
      try {
        const jsonParsed = JSON.parse(trimmed)
        if (Array.isArray(jsonParsed)) {
          parsed = jsonParsed as Array<{ day: string; enabled: boolean; start: string; end: string }>
        }
      } catch {
        return []
      }
    }

    const dayLabelMap: Record<string, string> = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    }

    return parsed
      .filter((slot) => slot && slot.enabled && slot.start && slot.end)
      .map((slot) => ({
        ...slot,
        day: dayLabelMap[slot.day] || slot.day
      }))
  }

  const isPaidAction = () => {
    if (!post) return false
    const paymentType = String(post.payment_type || '').toLowerCase().trim()
    const paidTypes = new Set(['remuneration', 'rémunération', 'price', 'paid', 'argent', 'money'])
    if (paidTypes.has(paymentType)) return true
    return Number(post.price || 0) > 0
  }

  const getActionButtonLabel = () => {
    if (matchRequest?.status === 'pending') {
      if (contactIntent === 'reserve') return 'Réservation envoyée'
      if (contactIntent === 'ticket') return 'Demande de billet envoyée'
      if (contactIntent === 'apply') return 'Candidature envoyée'
      if (contactIntent === 'buy') return 'Achat en attente'
      return 'Demande envoyée'
    }

    if (matchRequest?.status === 'accepted') {
      if (contactIntent === 'reserve') return 'Réservation acceptée'
      if (contactIntent === 'ticket') return 'Billet validé'
      if (contactIntent === 'apply') return 'Candidature acceptée'
      if (contactIntent === 'buy') return 'Achat validé'
      return 'Demande acceptée'
    }

    if (contactIntent === 'reserve') return 'Réserver'
    if (contactIntent === 'ticket') return 'Réserver un billet'
    if (contactIntent === 'apply') return 'Postuler'
    if (contactIntent === 'buy') return 'Acheter'
    return 'Faire une demande'
  }

  const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h${String(mins).padStart(2, '0')}`
    if (hours > 0) return `${hours}h`
    return `${mins} min`
  }

  const hasAddress = post?.location_address || (post?.location_lat && post?.location_lng)
  const openingHoursList = getOpeningHoursList(post?.opening_hours)
  const categorySlug = (post?.category?.slug || '').trim().toLowerCase()
  const subCategorySlug = (post?.sub_category?.slug || '').trim().toLowerCase()
  const isStudioLieuPost = categorySlug === 'studio-lieu'
  const isEmploiRequestPost = EMPLOI_CATEGORY_SLUGS.has(categorySlug) && post?.listing_type === 'request'
  const isCastingFigurantRequestPost =
    (categorySlug === 'casting-role' || categorySlug === 'casting') &&
    post?.listing_type === 'request' &&
    subCategorySlug === 'figurant'
  const isProjetsEquipeRequestPost =
    (categorySlug === 'projets-equipe' || categorySlug === 'projet') &&
    post?.listing_type === 'request'

  // Fonctions pour le swipe des images
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && mediaItems.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)
    }
    if (isRightSwipe && mediaItems.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
    }
  }

  const isVideoUrl = (url: string) => {
    const cleanUrl = url.split('?')[0].split('#')[0]
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)
  }

  const handleOpenViewer = (index: number) => {
    if (mediaItems.length === 0) return
    setCurrentImageIndex(index)
    setIsMediaViewerOpen(true)
  }

  const handleCloseViewer = useCallback(() => {
    setIsMediaViewerOpen(false)
  }, [])

  const goToNextMedia = useCallback(() => {
    if (mediaItems.length === 0) return
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)
  }, [mediaItems.length])

  const goToPrevMedia = useCallback(() => {
    if (mediaItems.length === 0) return
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }, [mediaItems.length])

  const onViewerTouchStart = (e: React.TouchEvent) => {
    setViewerTouchEnd(null)
    setViewerTouchStart(e.targetTouches[0].clientX)
  }

  const onViewerTouchMove = (e: React.TouchEvent) => {
    setViewerTouchEnd(e.targetTouches[0].clientX)
  }

  const onViewerTouchEnd = () => {
    if (!viewerTouchStart || !viewerTouchEnd) return
    const distance = viewerTouchStart - viewerTouchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setViewerDidSwipe(true)
      goToNextMedia()
    }
    if (isRightSwipe) {
      setViewerDidSwipe(true)
      goToPrevMedia()
    }
  }

  useEffect(() => {
    if (!isMediaViewerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseViewer()
        return
      }
      if (event.key === 'ArrowRight') {
        goToNextMedia()
        return
      }
      if (event.key === 'ArrowLeft') {
        goToPrevMedia()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMediaViewerOpen, handleCloseViewer, goToNextMedia, goToPrevMedia])

  if (loading) {
    return (
      <div className="app">
        <div className="post-details-page">
          <div className="post-details-scrollable">
            <div className="loading-container">
              <p>Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app">
        <div className="post-details-page">
          <div className="post-details-scrollable">
            <div className="empty-state">
              <p>{isRestricted ? 'Annonce indisponible' : 'Annonce introuvable'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="post-details-page has-hero-image">
        {/* Header fixe */}
        <div className="post-details-header-fixed">
          <div className="post-details-header-content">
            <BackButton onClick={handleBackFromPost} />
            <div className="post-details-header-spacer"></div>
            <div className="post-details-header-actions">
              <button className="post-header-action-btn" onClick={handleShare}>
                <Share size={20} />
              </button>
              <button className="post-header-action-btn post-header-like-btn" onClick={handleLike}>
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Bloc vide pour l'espace en haut */}
        <div className="post-hero-spacer"></div>

        {/* Carrousel d'images avec swipe */}
        <div 
          className="post-hero-image"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(event) => {
            const target = event.target as HTMLElement
            if (target.closest('button') || target.closest('a')) return
            handleOpenViewer(currentImageIndex)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleOpenViewer(currentImageIndex)
            }
          }}
        >
          {mediaItems.length > 0 ? (
            <>
              <div 
                className="post-hero-image-carousel"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {mediaItems.map((image, index) => (
                  <div key={index} className="post-hero-image-slide">
                    {isVideoUrl(image) ? (
                      <video
                        src={image}
                        playsInline
                        muted
                        preload="metadata"
                        className="post-hero-media"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleOpenViewer(index)
                        }}
                      />
                    ) : (
                      <img src={image} alt={`${post.title} - Média ${index + 1}`} />
                    )}
                  </div>
                ))}
              </div>
              {/* Compteur d'images */}
              {mediaItems.length > 1 && (
                <div className="post-hero-image-counter">
                  {currentImageIndex + 1} / {mediaItems.length}
                </div>
              )}
              {/* Indicateurs de pagination */}
              {mediaItems.length > 1 && (
                <div className="post-hero-image-indicators">
                  {mediaItems.map((_, index) => (
                    <button
                      key={index}
                      className={`post-hero-image-indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Aller au média ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="post-hero-image-placeholder">
              <ImageOff size={64} />
            </div>
          )}
          {/* Badge catégorie en haut à gauche */}
          {post.category && (
            <div className="post-hero-category-badge">{post.category.name}</div>
          )}
          {/* Badge URGENT en bas à gauche */}
          {post.is_urgent && (
            <div className="post-urgent-badge">URGENT</div>
          )}
        </div>

        {isMediaViewerOpen && mediaItems.length > 0 && (
          <div
            className="post-media-viewer-overlay"
            onClick={() => {
              if (viewerDidSwipe) {
                setViewerDidSwipe(false)
                return
              }
              handleCloseViewer()
            }}
            role="dialog"
            aria-modal="true"
            onTouchStart={onViewerTouchStart}
            onTouchMove={onViewerTouchMove}
            onTouchEnd={onViewerTouchEnd}
          >
            <div
              className="post-media-viewer-content"
            >
              <button
                type="button"
                className="post-media-viewer-close"
                onClick={(event) => {
                  event.stopPropagation()
                  handleCloseViewer()
                }}
                aria-label="Fermer la galerie"
              >
                <X size={20} />
              </button>
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    className="post-media-viewer-nav post-media-viewer-nav-left"
                    onClick={(event) => {
                      event.stopPropagation()
                      goToPrevMedia()
                    }}
                    aria-label="Média précédent"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    type="button"
                    className="post-media-viewer-nav post-media-viewer-nav-right"
                    onClick={(event) => {
                      event.stopPropagation()
                      goToNextMedia()
                    }}
                    aria-label="Média suivant"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
              <div
                className="post-media-viewer-media"
                onClick={(event) => event.stopPropagation()}
              >
                {isVideoUrl(mediaItems[currentImageIndex]) ? (
                  <video
                    src={mediaItems[currentImageIndex]}
                    className="post-media-viewer-video"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaItems[currentImageIndex]}
                    alt={`${post.title} - Média ${currentImageIndex + 1}`}
                    className="post-media-viewer-image"
                  />
                )}
              </div>
              {mediaItems.length > 1 && (
                <div className="post-media-viewer-counter">
                  {currentImageIndex + 1} / {mediaItems.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zone scrollable */}
        <div className="post-details-scrollable">
          <div className="post-details-content">
            {/* Titre */}
            <div className="post-title-section">
              <h1 className="post-title-main">{post.title}</h1>
            </div>

            {/* Informations sous le titre */}
            <div className="post-title-meta">
              {post.location && (
                <span className="post-title-meta-item">
                  <MapPin size={16} /> {post.location}
                </span>
              )}
              {post.needed_date && !isCastingFigurantRequestPost && !isProjetsEquipeRequestPost && (
                <span className="post-title-meta-item">
                  Pour le {new Date(post.needed_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                  {!isEmploiRequestPost && post.needed_time ? ` à ${post.needed_time}` : ''}
                  {!isEmploiRequestPost && post.duration_minutes ? ` pour ${formatDuration(post.duration_minutes)}` : ''}
                </span>
              )}
            </div>

            {/* Prix en grand */}
            {!isEmploiRequestPost && post.price && (
              <div className="post-price-main">{post.price} €</div>
            )}

            {/* Informations secondaires */}
            <div className="post-meta-info">
              <span className="post-meta-item post-meta-item-date">
                Publié le {new Date(post.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}{' '}
                à {new Date(post.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Profil de l'auteur */}
            {post.user && (
              <div className="author-section">
                <Link to={`/profile/public/${post.user.id}`} className="author-card">
                  {post.user.avatar_url && (
                    <img src={post.user.avatar_url} alt={post.user.full_name || ''} />
                  )}
                  <div className="author-info">
                    <div className="author-name">
                      {post.user.full_name || post.user.username || 'Utilisateur'}
                    </div>
                    {authorPostCount !== null && (
                      <div className="author-meta">
                        {authorPostCount} annonce{authorPostCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="author-chevron" size={20} />
                </Link>
              </div>
            )}

            {/* Description */}
            <div className="post-description-section">
              <h3 className="post-description-title">Description</h3>
              <p className="post-description-text">{post.description}</p>
              {!isEmploiRequestPost && (post.responsibilities || post.required_skills || post.benefits) && (
                <div className="post-description-details">
                  {post.responsibilities && (
                    <div className="post-description-detail">
                      <span className="post-description-detail-label">Missions</span>
                      <span className="post-description-detail-value">{post.responsibilities}</span>
                    </div>
                  )}
                  {post.required_skills && (
                    <div className="post-description-detail">
                      <span className="post-description-detail-label">Compétences recherchées</span>
                      <span className="post-description-detail-value">{post.required_skills}</span>
                    </div>
                  )}
                  {post.benefits && (
                    <div className="post-description-detail">
                      <span className="post-description-detail-label">Avantages</span>
                      <span className="post-description-detail-value">{post.benefits}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Autres informations nécessaires */}
            <div className="post-additional-info-section">
              <h3 className="post-additional-title">Autre informations nécessaire</h3>
              {/* Type de contrat */}
              {post.contract_type && (
                <div className="post-info-item">
                  <span className="post-info-label">Type de contrat</span>
                  <span className="post-info-value">{post.contract_type}</span>
                </div>
              )}

              {/* Horaires */}
              {post.work_schedule && (
                <div className="post-info-item">
                  <span className="post-info-label">Horaires</span>
                  <span className="post-info-value">{post.work_schedule}</span>
                </div>
              )}
              {/* Catégorie et sous-catégorie */}
              {(post.category || post.sub_category) && (
                <div className="post-info-item">
                  <span className="post-info-label">Catégorie</span>
                  <span className="post-info-value">
                    {post.category?.name}
                    {post.sub_category && ` > ${post.sub_category.name}`}
              </span>
            </div>
              )}

              {/* Réseau social */}
              {post.media_type && (
                <div className="post-info-item">
                  <span className="post-info-label">Réseau</span>
                  <span className="post-info-value">{post.media_type}</span>
                </div>
              )}

              {/* Moyen de paiement et localisation retirés (déjà affichés en haut) */}

              {/* Lien externe */}
              {post.external_link && !isProjetsEquipeRequestPost && (
                <div className="post-info-item">
                  <span className="post-info-label">Lien</span>
                  <span className="post-info-value">
                    <a
                      className="post-external-link"
                      href={post.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir le lien
                    </a>
                  </span>
                </div>
              )}

              {/* Document PDF */}
              {post.document_url && !isProjetsEquipeRequestPost && (
                <div className="post-info-item">
                  <span className="post-info-label">Document</span>
                  <span className="post-info-value">
                    <a
                      className="post-document-link"
                      href={post.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getDocumentName(post.document_url)}
                    </a>
                  </span>
                </div>
              )}

              {/* Nombre de personnes */}
              {!isEmploiRequestPost && !isCastingFigurantRequestPost && !isProjetsEquipeRequestPost && post.number_of_people && (
                <div className="post-info-item">
                  <span className="post-info-label">Nombre de personnes</span>
                  <span className="post-info-value post-info-value-right">{post.number_of_people}</span>
                </div>
              )}

              {(!isCastingFigurantRequestPost && !isProjetsEquipeRequestPost && (isEmploiRequestPost ? !!post.needed_date : (post.needed_date || post.needed_time || post.duration_minutes))) && (
                <div className="post-info-item">
                  <span className="post-info-label">{isEmploiRequestPost ? 'Date' : 'Date et heure'}</span>
                  <span className="post-info-value post-info-value-nowrap">
                    {post.needed_date
                      ? new Date(post.needed_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                      : ''}
                    {!isEmploiRequestPost && post.needed_time ? ` à ${post.needed_time}` : ''}
                    {!isEmploiRequestPost && post.duration_minutes ? ` pour ${formatDuration(post.duration_minutes)}` : ''}
                  </span>
                </div>
              )}

              {isStudioLieuPost && openingHoursList.length > 0 && (
                <div className="post-info-item">
                  <span className="post-info-label">Jours et horaires d'ouverture</span>
                  <span className="post-info-value">
                    {openingHoursList.map((slot) => `${slot.day}: ${slot.start} - ${slot.end}`).join(' | ')}
                  </span>
                </div>
              )}

              {isStudioLieuPost && post.billing_hours && post.billing_hours > 0 && (
                <div className="post-info-item">
                  <span className="post-info-label">Temps facturé</span>
                  <span className="post-info-value">{formatDuration(post.billing_hours)}</span>
                </div>
              )}

              {!isEmploiRequestPost && !isProjetsEquipeRequestPost && post.profile_level && (
                <div className="post-info-item">
                  <span className="post-info-label">Niveau recherché</span>
                  <span className="post-info-value">{post.profile_level}</span>
                </div>
              )}

              {!isEmploiRequestPost && !isProjetsEquipeRequestPost && getProfileRolesList(post.profile_roles).length > 0 && (
                <div className="post-info-item">
                  <span className="post-info-label">Rôle recherché</span>
                  <span className="post-info-value">
                    {getProfileRolesList(post.profile_roles).join(', ')}
                  </span>
                </div>
              )}

              {/* Livraison disponible */}
              {post.delivery_available && (
                <div className="post-info-item">
                  <span className="post-info-label">Livraison :</span>
                  <span className="post-info-value">Disponible</span>
                </div>
              )}
            </div>

            {/* Localisation */}
            {(post.location || hasAddress) && (
              <div className="post-location-details-section">
                <h3 className="post-additional-title">Localisation</h3>
                <div className="post-info-item">
                  <span className="post-info-label">Lieu</span>
                  <div className="post-info-value">
                    <div className="post-address-text">
                      <MapPin size={16} />
                      <span>{post.location || post.location_address || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
                {post.location_address && post.location_address !== post.location && (
                  <div className="post-info-item">
                    <span className="post-info-label">Adresse</span>
                    <div className="post-info-value">
                      <div className="post-address-text">
                        <MapPin size={16} />
                        <span>{post.location_address}</span>
                      </div>
                      {post.location_lat && post.location_lng && (
                        <div className="post-address-coords">
                          {post.location_lat.toFixed(6)}, {post.location_lng.toFixed(6)}
                        </div>
                      )}
                      {post.location_lat && post.location_lng && (
                        <button className="post-address-nav-btn-small" onClick={handleOpenNavigation}>
                          <Navigation size={18} />
                          Itinéraire
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {post.location_lat && post.location_lng && (
                  <div className="post-map-section">
                    <GoogleMapComponent
                      lat={post.location_lat}
                      lng={post.location_lng}
                      address={post.location_address || post.location || undefined}
                      height="400px"
                      zoom={15}
                      markerTitle={post.location_address || post.location || post.title}
                      onMarkerClick={handleOpenNavigation}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Section candidatures pour les matchs (propriétaire uniquement) */}
            {isOwner && applications.length > 0 && (
              <div className="applications-section">
                <h3>Candidatures ({applications.length})</h3>
                {applications.map((app) => (
                  <div key={app.id} className="application-card">
                    <div className="application-header">
                      <div className="application-user">
                        {app.applicant?.avatar_url && (
                          <img src={app.applicant.avatar_url} alt={app.applicant.full_name || ''} />
                        )}
                        <div>
                          <div className="application-name">
                            {app.applicant?.full_name || app.applicant?.username || 'Utilisateur'}
                          </div>
                          <div className="application-date">
                            {new Date(app.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="application-status">{app.status}</div>
                    </div>
                    {app.message && <p className="application-message">{app.message}</p>}
                    {app.status === 'pending' && (
                      <div className="application-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleAcceptApplication(app.id)}
                        >
                          <Check size={18} />
                          Accepter
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectApplication(app.id)}
                        >
                          <X size={18} />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Autres annonces */}
            {recommendedPosts.length > 0 && (
              <div className="other-posts-section">
                <button
                  type="button"
                  className="other-posts-header"
                  onClick={() =>
                    navigate(`/post/${id}/recommendations`, {
                      state: {
                        originPath: getOriginPath(),
                        sourcePostPath: currentPath
                      }
                    })
                  }
                >
                  <h3>Annonces similaires</h3>
                  <ChevronRight size={18} />
                </button>
                <div className="other-posts-grid">
                  {recommendedPosts.map((relatedPost) => (
                    <PostCard key={relatedPost.id} post={relatedPost} viewMode="grid" hideCategoryBadge />
                  ))}
                  <button
                    className="other-posts-plus-btn"
                    onClick={() =>
                      navigate(`/post/${id}/recommendations`, {
                        state: {
                          originPath: getOriginPath(),
                          sourcePostPath: currentPath
                        }
                      })
                    }
                  >
                    <Plus size={32} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barre d'action fixe en bas */}
        {user && !isOwner && (
          <div className="post-action-bar">
            <button 
              className={`post-action-btn post-action-btn-primary ${matchRequest?.status === 'pending' ? 'post-action-button-sent' : matchRequest?.status === 'accepted' ? 'post-action-button-accepted' : ''}`}
              onClick={handleApply}
              disabled={loadingRequest || matchRequest?.status === 'accepted'}
            >
              {getActionButtonLabel()}
            </button>
          </div>
        )}

        {/* Modal de confirmation d'envoi de demande */}
        {showSendRequestModal && (
          <ConfirmationModal
            visible={showSendRequestModal}
            title={
              contactIntent === 'apply'
                ? 'Postuler'
                : contactIntent === 'reserve'
                  ? 'Réserver un lieu'
                  : contactIntent === 'ticket'
                    ? 'Réserver un billet'
                    : contactIntent === 'buy'
                      ? 'Acheter'
                      : 'Message personnalisé'
            }
            message={
              contactIntent === 'apply'
                ? 'Envoyez votre candidature avec votre CV.'
                : contactIntent === 'reserve'
                  ? 'Renseignez la date, l’heure et la durée de réservation.'
                  : contactIntent === 'ticket'
                    ? 'Confirmez votre billet.'
                    : contactIntent === 'buy'
                      ? 'Confirmez votre demande d’achat.'
                      : 'Ajoutez un message pour votre demande.'
            }
            onConfirm={handleSendRequest}
            onCancel={() => {
              setShowSendRequestModal(false)
              setRequestMessage('')
              setRequestRole('')
              setRequestCvDocument(null)
              setRequestCvDocumentName('')
              setRequestCoverLetterDocument(null)
              setRequestCoverLetterDocumentName('')
              setReservationDate('')
              setReservationTime('')
              setReservationDurationMinutes(60)
            }}
            confirmLabel={loadingRequest ? 'Envoi...' : contactIntent === 'ticket' ? (isPaidAction() ? 'Payer le billet' : 'Valider le billet') : contactIntent === 'reserve' ? (isPaidAction() ? 'Payer la réservation' : 'Valider la réservation') : contactIntent === 'buy' ? 'Confirmer l’achat' : 'Envoyer'}
            cancelLabel="Annuler"
          >
            {!isEmploiRequestPost && !isProjetsEquipeRequestPost && getProfileRolesList(post?.profile_roles).length > 0 && (
              <div className="confirmation-modal-field">
                <label className="confirmation-modal-label">
                  Poste recherché
                </label>
                <div className="request-role-list">
                  {getProfileRolesList(post?.profile_roles).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`request-role-option ${requestRole === role ? 'active' : ''}`}
                      onClick={() => setRequestRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="confirmation-modal-field">
              <label className="confirmation-modal-label" htmlFor="match-request-message">
                Votre message
              </label>
              <textarea
                id="match-request-message"
                className="confirmation-modal-textarea"
                placeholder="Écrivez votre message ici."
                value={requestMessage}
                maxLength={500}
                onChange={(event) => setRequestMessage(event.target.value)}
                autoFocus
              />
              <div className="confirmation-modal-hint">{requestMessage.length}/500</div>
            </div>

            {contactIntent === 'apply' && (
              <>
                <div className="confirmation-modal-field">
                  <label className="confirmation-modal-label" htmlFor="match-request-cv">
                    CV (obligatoire)
                  </label>
                  <div className="confirmation-modal-file-input-wrapper">
                    <input
                      id="match-request-cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="confirmation-modal-file-input"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        try {
                          validateRequestFile(file)
                          setRequestCvDocument(file)
                          setRequestCvDocumentName(file.name)
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Fichier invalide')
                        }
                      }}
                    />
                    {requestCvDocumentName && (
                      <div className="confirmation-modal-file-name">
                        ✓ {requestCvDocumentName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="confirmation-modal-field">
                  <label className="confirmation-modal-label" htmlFor="match-request-cover-letter">
                    Lettre de motivation (optionnel)
                  </label>
                  <div className="confirmation-modal-file-input-wrapper">
                    <input
                      id="match-request-cover-letter"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="confirmation-modal-file-input"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        try {
                          validateRequestFile(file)
                          setRequestCoverLetterDocument(file)
                          setRequestCoverLetterDocumentName(file.name)
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Fichier invalide')
                        }
                      }}
                    />
                    {requestCoverLetterDocumentName && (
                      <div className="confirmation-modal-file-name">
                        ✓ {requestCoverLetterDocumentName}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {contactIntent === 'reserve' && (
              <>
                <div className="confirmation-modal-field">
                  <label className="confirmation-modal-label" htmlFor="reservation-date">
                    Date
                  </label>
                  <input
                    id="reservation-date"
                    type="date"
                    className="confirmation-modal-input"
                    value={reservationDate}
                    onChange={(event) => setReservationDate(event.target.value)}
                  />
                </div>
                <div className="confirmation-modal-field">
                  <label className="confirmation-modal-label" htmlFor="reservation-time">
                    Heure
                  </label>
                  <input
                    id="reservation-time"
                    type="time"
                    className="confirmation-modal-input"
                    value={reservationTime}
                    onChange={(event) => setReservationTime(event.target.value)}
                  />
                </div>
                <div className="confirmation-modal-field">
                  <label className="confirmation-modal-label" htmlFor="reservation-duration">
                    Durée (minutes)
                  </label>
                  <input
                    id="reservation-duration"
                    type="number"
                    min={30}
                    step={30}
                    className="confirmation-modal-input"
                    value={reservationDurationMinutes}
                    onChange={(event) => setReservationDurationMinutes(Number(event.target.value) || 60)}
                  />
                </div>
              </>
            )}
          </ConfirmationModal>
        )}

        {/* Modal de confirmation d'annulation de demande */}
        {showCancelRequestModal && (
          <ConfirmationModal
            visible={showCancelRequestModal}
            title="Annuler cette demande"
            message="Vous allez annuler la demande de match que vous avez envoyée. Vous pourrez toujours renvoyer une nouvelle demande plus tard."
            onConfirm={handleCancelRequest}
            onCancel={() => setShowCancelRequestModal(false)}
            confirmLabel={loadingRequest ? 'Annulation...' : 'Oui, annuler'}
            cancelLabel="Non, garder la demande"
          />
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && (
          <ConfirmationModal
            visible={showDeleteConfirm}
            title="Supprimer l'annonce"
            message="Cette action est irréversible."
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmLabel="Supprimer"
            cancelLabel="Annuler"
            isDestructive={true}
          />
        )}
      </div>
    </div>
  )
}

export default PostDetails
