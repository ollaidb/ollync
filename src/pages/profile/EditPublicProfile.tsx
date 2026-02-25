import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, X, Camera, Plus, ChevronUp, ChevronDown, Check, Instagram, Linkedin, Facebook, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConsent } from '../../hooks/useConsent'
import { useConfirmation } from '../../hooks/useConfirmation'
import { useToastContext } from '../../contexts/ToastContext'
import { useNavigationHistory } from '../../hooks/useNavigationHistory'
import PageHeader from '../../components/PageHeader'
import ConsentModal from '../../components/ConsentModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import SaveChangesModal from '../../components/SaveChangesModal'
import { LocationAutocomplete } from '../../components/Location/LocationAutocomplete'
import { CustomList } from '../../components/CustomList/CustomList'
import { publicationTypes } from '../../constants/publishData'
import { getAllPaymentOptions, getPaymentOptionConfig, getPaymentOptionsForCategory } from '../../utils/publishHelpers'
import { getLinkPlatform } from '../../utils/linkPlatform'
import './EditPublicProfile.css'

const EditPublicProfile = () => {
  const { t } = useTranslation(['categories'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState({
    avatar_url: '',
    username: '',
    full_name: '',
    location: '',
    bio: '',
    skills: [] as string[],
    display_categories: [] as string[],
    display_subcategories: [] as string[],
    profile_types: [] as string[],
    services: [] as Array<{
      name: string
      description: string
      payment_type: string
      value: string
    }>,
    venue_opening_hours: [
      { day: 'lundi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'mardi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'mercredi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'jeudi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'vendredi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'samedi', enabled: false, start: '09:00', end: '18:00' },
      { day: 'dimanche', enabled: false, start: '09:00', end: '18:00' }
    ] as Array<{ day: string; enabled: boolean; start: string; end: string }>,
    venue_billing_hours: '01:00',
    venue_payment_types: [] as string[],
    socialLinks: [] as string[],
    phone: '',
    email: '',
    phone_verified: false,
    email_verified: false,
    show_in_users: true
  })
  const [displayCategorySearch, setDisplayCategorySearch] = useState('')
  const [showDisplayCategorySuggestions, setShowDisplayCategorySuggestions] = useState(false)
  const displayCategorySearchRef = useRef<HTMLDivElement>(null)
  const [activeDisplaySubcategoryCategory, setActiveDisplaySubcategoryCategory] = useState<string | null>(null)
  const [displaySubcategorySearch, setDisplaySubcategorySearch] = useState('')
  const [showDisplaySubcategorySuggestions, setShowDisplaySubcategorySuggestions] = useState(false)
  const displaySubcategorySearchRef = useRef<HTMLDivElement>(null)
  const [profileTypeSearch, setProfileTypeSearch] = useState('')
  const [showProfileTypeSuggestions, setShowProfileTypeSuggestions] = useState(false)
  const profileTypeSearchRef = useRef<HTMLDivElement>(null)
  const [showCustomProfileTypeInput, setShowCustomProfileTypeInput] = useState(false)
  const [customProfileType, setCustomProfileType] = useState('')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    payment_type: '',
    value: ''
  })
  const [showServiceNameSuggestions, setShowServiceNameSuggestions] = useState(false)
  const [isServicePaymentOpen, setIsServicePaymentOpen] = useState(false)
  const [isVenueSettingsPanelOpen, setIsVenueSettingsPanelOpen] = useState(false)
  const [isVenuePaymentOpen, setIsVenuePaymentOpen] = useState(false)
  const [isVenueOpeningDaysOpen, setIsVenueOpeningDaysOpen] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')
  const fromProfileProgress = searchParams.get('from') === 'profile-progress'

  const VENUE_CATEGORY_SLUGS = useMemo(() => (['studio-lieu', 'lieu']), [])
  const SERVICE_CATEGORY_SLUGS = useMemo(() => (['services', 'service', 'mission', 'poste-service']), [])
  const venueDayLabels: Record<string, string> = useMemo(() => ({
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  }), [])

  // Hook de consentement pour les données personnelles du profil
  const profileConsent = useConsent('profile_data')
  const confirmation = useConfirmation()
  const { showSuccess, showError } = useToastContext()
  const { markNavigatingBack, getPreviousPath } = useNavigationHistory()
  const initialProfileRef = useRef<string | null>(null)
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const pendingNavigateTargetRef = useRef<string | null>(null)

  const hasUnsavedChanges = useMemo(() => {
    if (initialProfileRef.current === null) return false
    return JSON.stringify(profile) !== initialProfileRef.current
  }, [profile])

  const getBackNavigationTarget = useCallback(() => {
    const prev = getPreviousPath()
    if (prev === '/profile/public' || prev.startsWith('/profile/public')) return '/profile/public'
    return prev || '/profile'
  }, [getPreviousPath])

  const performBackNavigation = useCallback(() => {
    const target = pendingNavigateTargetRef.current || getBackNavigationTarget()
    pendingNavigateTargetRef.current = null
    markNavigatingBack()
    navigate(target)
  }, [getBackNavigationTarget, markNavigatingBack, navigate])

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      pendingNavigateTargetRef.current = getBackNavigationTarget()
      setShowSaveConfirmModal(true)
    } else {
      performBackNavigation()
    }
  }, [hasUnsavedChanges, getBackNavigationTarget, performBackNavigation])

  const handleSaveConfirmDiscard = useCallback(() => {
    setShowSaveConfirmModal(false)
    performBackNavigation()
  }, [performBackNavigation])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  // Gérer le refus : rediriger vers la page de profil
  const handleRejectConsent = () => {
    profileConsent.handleReject()
    // Retourner vers /profile (niveau parent)
    markNavigatingBack()
    navigate('/profile')
  }

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Récupérer les données depuis auth.users (source de vérité pour les noms)
    const authFullName = user.user_metadata?.full_name || null
    const authUsername = user.user_metadata?.username || null
    
    // Récupérer les autres données depuis profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    }
    
    const profileData = data || {}
    const socialLinksObj = (profileData as { social_links?: Record<string, string> | null }).social_links || {}

    const parseTextArray = (value: unknown) => {
      if (!value) return [] as string[]
      if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item)).filter(Boolean)
          }
        } catch {
          return value.split(',').map((item) => item.trim()).filter(Boolean)
        }
      }
      return [] as string[]
    }
    
    // Trois emplacements de liens : website, instagram, linkedin (ordre affiché dans le formulaire)
    const socialLinksArray: string[] = [
      (socialLinksObj.website || '').trim(),
      (socialLinksObj.instagram || '').trim(),
      (socialLinksObj.linkedin || '').trim()
    ]
    
    const parseProfileTypes = (value: unknown) => {
      if (!value) return []
      if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean)
      if (typeof value !== 'string') return []
      const trimmed = value.trim()
      if (!trimmed) return []
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v)).filter(Boolean)
        }
      } catch {
        // Ignore JSON parse errors and fall back to delimiter split
      }
      return trimmed
        .split('||')
        .map(item => item.trim())
        .filter(Boolean)
    }

    const normalizeTime = (value: string) => {
      const cleaned = value.replace(/[^\d:]/g, '')
      const parts = cleaned.split(':')
      if (parts.length === 1) {
        const raw = parts[0]
        if (raw.length <= 2) return raw
        return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
      }
      const [h, m] = parts
      return `${h.slice(0, 2)}:${m.slice(0, 2)}`
    }

    const formatTime = (value: string) => {
      const [hRaw, mRaw] = value.split(':')
      const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
      const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const minutesToTime = (minutes?: number | null) => {
      const safe = Math.max(0, Number.isFinite(minutes as number) ? Math.floor(minutes as number) : 0)
      const hours = Math.floor(safe / 60)
      const mins = safe % 60
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
    }

    const parseVenueOpeningHours = (value: unknown) => {
      const defaults = [
        { day: 'lundi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'mardi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'mercredi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'jeudi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'vendredi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'samedi', enabled: false, start: '09:00', end: '18:00' },
        { day: 'dimanche', enabled: false, start: '09:00', end: '18:00' }
      ]
      if (!Array.isArray(value)) return defaults
      const map = new Map<string, { day: string; enabled: boolean; start: string; end: string }>()
      value.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const obj = item as Record<string, unknown>
        const day = String(obj.day || '').toLowerCase()
        if (!day) return
        map.set(day, {
          day,
          enabled: Boolean(obj.enabled),
          start: formatTime(normalizeTime(String(obj.start || '09:00')) || '09:00'),
          end: formatTime(normalizeTime(String(obj.end || '18:00')) || '18:00')
        })
      })
      return defaults.map((slot) => map.get(slot.day) || slot)
    }

    const parseVenuePaymentTypes = (value: unknown) => {
      if (!value) return []
      if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item)).filter(Boolean)
          }
        } catch {
          return value.split(',').map((item) => item.trim()).filter(Boolean)
        }
      }
      return []
    }

    const initialProfileTypes = parseProfileTypes((profileData as { profile_type?: string | null }).profile_type)
      .filter(type => type !== 'other')

    const initialProfile = {
      avatar_url: (profileData as { avatar_url?: string | null }).avatar_url || '',
      username: authUsername || (profileData as { username?: string | null }).username || '',
      full_name: authFullName || (profileData as { full_name?: string | null }).full_name || '',
      location: (profileData as { location?: string | null }).location || '',
      bio: (profileData as { bio?: string | null }).bio || '',
      skills: (profileData as { skills?: string[] | null }).skills || [],
      display_categories: (profileData as { display_categories?: string[] | null }).display_categories || [],
      display_subcategories: parseTextArray((profileData as { display_subcategories?: unknown }).display_subcategories),
      profile_types: initialProfileTypes,
      services: (() => {
        const servicesData = (profileData as { services?: Array<{ name: string; description: string; payment_type: string; value: string }> | string[] | null }).services
        if (!servicesData) {
          console.log('ℹ️ Aucun service dans le profil (édition)')
          return []
        }
        
        // Si c'est une string JSON, la parser
        let parsedData = servicesData
        if (typeof servicesData === 'string') {
          try {
            parsedData = JSON.parse(servicesData)
          } catch (e) {
            console.error('Erreur parsing services (édition):', e)
            return []
          }
        }
        
        if (!Array.isArray(parsedData)) {
          console.warn('⚠️ Services n\'est pas un tableau (édition):', parsedData)
          return []
        }
        
        console.log(`📦 Services récupérés pour édition: ${parsedData.length}`, parsedData)
        
        // Si les services sont encore des strings (ancien format), les convertir
        if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
          const converted = (parsedData as string[]).map(name => {
            // Si la string est du JSON, le parser
            let serviceName = name
            try {
              const parsed = JSON.parse(name)
              serviceName = typeof parsed === 'string' ? parsed : (parsed?.name || name)
            } catch {
              // Ce n'est pas du JSON, utiliser la string directement
              serviceName = name
            }
            return {
              name: serviceName,
              description: '',
              payment_type: 'remuneration',
              value: ''
            }
          })
          return converted
        }
        
        // Normaliser les services - s'assurer que tous sont bien formatés
        const normalized = (parsedData as Array<unknown>).map((service, index) => {
          // Si le service est une string, la convertir
          if (typeof service === 'string') {
            let serviceName = service
            try {
              const parsed = JSON.parse(service)
              serviceName = typeof parsed === 'string' ? parsed : (parsed?.name || service)
            } catch {
              serviceName = service
            }
            return {
              name: serviceName,
              description: '',
              payment_type: 'price' as const,
              value: ''
            }
          }
          
          // Si c'est un objet, normaliser
          const serviceObj: Record<string, unknown> = typeof service === 'object' && service !== null ? service as Record<string, unknown> : {}
          const rawPaymentType = String(serviceObj.payment_type || '').trim()
          const normalizedPaymentType = rawPaymentType === 'exchange'
            ? 'echange'
            : rawPaymentType === 'price'
              ? 'remuneration'
              : rawPaymentType || 'remuneration'
          const normalizedService = {
            name: String(serviceObj.name || '').trim(),
            description: String(serviceObj.description || '').trim(),
            payment_type: normalizedPaymentType,
            value: String(serviceObj.value || '').trim()
          }
          console.log(`  Service ${index}:`, normalizedService)
          return normalizedService
        }).filter(service => service.name && service.name.trim().length > 0) // Filtrer les services sans nom
        
        console.log(`✅ Services normalisés pour édition: ${normalized.length}`)
        return normalized
      })(),
      venue_opening_hours: parseVenueOpeningHours((profileData as { venue_opening_hours?: unknown }).venue_opening_hours),
      venue_billing_hours: minutesToTime((profileData as { venue_billing_hours?: number | null }).venue_billing_hours || 60),
      venue_payment_types: parseVenuePaymentTypes((profileData as { venue_payment_types?: unknown }).venue_payment_types),
      socialLinks: socialLinksArray,
      phone: (profileData as { phone?: string | null }).phone || '',
      email: user.email || '',
      phone_verified: (profileData as { phone_verified?: boolean | null }).phone_verified || false,
      email_verified: !!user.email_confirmed_at,
      show_in_users: (profileData as { show_in_users?: boolean | null }).show_in_users ?? true
    }
    setProfile(initialProfile)
    initialProfileRef.current = JSON.stringify(initialProfile)

    setLoading(false)
  }, [user])

  const isVenueDisplayCategory = useMemo(
    () => profile.display_categories.some((slug) => VENUE_CATEGORY_SLUGS.includes(slug)),
    [profile.display_categories, VENUE_CATEGORY_SLUGS]
  )
  const isServicesDisplayCategory = useMemo(
    () => profile.display_categories.some((slug) => SERVICE_CATEGORY_SLUGS.includes(slug)),
    [profile.display_categories, SERVICE_CATEGORY_SLUGS]
  )
  const venuePaymentOptions = useMemo(
    () => getPaymentOptionsForCategory('studio-lieu'),
    []
  )
  const selectedVenuePaymentRaw = profile.venue_payment_types[0] || ''
  const [selectedVenuePaymentType, selectedVenuePaymentValue = ''] = selectedVenuePaymentRaw.split('|')
  const selectedVenuePaymentName =
    venuePaymentOptions.find((option) => option.id === selectedVenuePaymentType)?.name ??
    'Choisir un moyen de paiement'

  const normalizeTime = (value: string) => {
    const cleaned = value.replace(/[^\d:]/g, '')
    const parts = cleaned.split(':')
    if (parts.length === 1) {
      const raw = parts[0]
      if (raw.length <= 2) return raw
      return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
    }
    const [h, m] = parts
    return `${h.slice(0, 2)}:${m.slice(0, 2)}`
  }

  const formatTime = (value: string) => {
    const [hRaw, mRaw] = value.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const timeToMinutes = (value: string) => {
    const [hRaw, mRaw] = value.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    return h * 60 + m
  }

  const updateVenueDay = (
    day: string,
    updates: Partial<{ enabled: boolean; start: string; end: string }>
  ) => {
    setProfile((prev) => ({
      ...prev,
      venue_opening_hours: prev.venue_opening_hours.map((slot) =>
        slot.day === day ? { ...slot, ...updates } : slot
      )
    }))
  }

  const stepVenueTime = (day: string, key: 'start' | 'end', deltaMinutes: number) => {
    const target = profile.venue_opening_hours.find((slot) => slot.day === day)
    if (!target) return
    const base = target[key] || '09:00'
    const [hRaw, mRaw] = base.split(':')
    const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
    const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    const nextH = Math.floor(normalized / 60)
    const nextM = normalized % 60
    updateVenueDay(day, { [key]: `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}` })
  }

  const setVenuePaymentType = (paymentType: string) => {
    setProfile((prev) => ({
      ...prev,
      venue_payment_types: paymentType ? [paymentType] : []
    }))
  }

  const setVenuePaymentValue = (value: string) => {
    setProfile((prev) => {
      const currentRaw = prev.venue_payment_types[0] || ''
      const [paymentType = ''] = currentRaw.split('|')
      if (!paymentType) return prev
      const trimmedValue = value.trim()
      return {
        ...prev,
        venue_payment_types: [trimmedValue ? `${paymentType}|${trimmedValue}` : paymentType]
      }
    })
  }

  const toggleVenueOpeningDay = (day: string) => {
    const target = profile.venue_opening_hours.find((slot) => slot.day === day)
    if (!target) return
    updateVenueDay(day, { enabled: !target.enabled })
  }

  const selectedVenueOpeningDays = profile.venue_opening_hours.filter((slot) => slot.enabled)

  const renderVenueBottomSheet = (
    open: boolean,
    onClose: () => void,
    title: string,
    content: ReactNode,
    panelClassName = ''
  ) => {
    if (!open || typeof document === 'undefined') return null
    const panelStyle: CSSProperties = keyboardInset > 0
      ? { bottom: keyboardInset, maxHeight: `calc(100vh - env(safe-area-inset-top, 0px) - 84px - ${keyboardInset}px)` }
      : {}
    return createPortal(
      <>
        <div className="publish-dropdown-backdrop" onClick={onClose} />
        <div
          className={`publish-dropdown-panel ${panelClassName}`.trim()}
          style={panelStyle}
          onClick={(event) => event.stopPropagation()}
        >
          {title && <div className="publish-dropdown-title">{title}</div>}
          {content}
        </div>
      </>,
      document.body
    )
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
    setLoading(false)
  }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isVenueDisplayCategory) {
      setIsVenueSettingsPanelOpen(false)
      setIsVenuePaymentOpen(false)
      setIsVenueOpeningDaysOpen(false)
    }
  }, [isVenueDisplayCategory])

  useEffect(() => {
    if (profile.display_categories.length === 0) {
      setActiveDisplaySubcategoryCategory(null)
      setShowDisplaySubcategorySuggestions(false)
      return
    }
    if (
      !activeDisplaySubcategoryCategory ||
      !profile.display_categories.includes(activeDisplaySubcategoryCategory)
    ) {
      setActiveDisplaySubcategoryCategory(profile.display_categories[0])
    }
  }, [profile.display_categories, activeDisplaySubcategoryCategory])

  useEffect(() => {
    if (!isVenueDisplayCategory) return
    if (!selectedVenuePaymentType) return
    const exists = venuePaymentOptions.some((option) => option.id === selectedVenuePaymentType)
    if (!exists) {
      setVenuePaymentType('')
    }
  }, [isVenueDisplayCategory, selectedVenuePaymentType, venuePaymentOptions])

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (displayCategorySearchRef.current && !displayCategorySearchRef.current.contains(target)) {
        setShowDisplayCategorySuggestions(false)
      }
      if (displaySubcategorySearchRef.current && !displaySubcategorySearchRef.current.contains(target)) {
        setShowDisplaySubcategorySuggestions(false)
      }
      if (profileTypeSearchRef.current && !profileTypeSearchRef.current.contains(target)) {
        setShowProfileTypeSuggestions(false)
      }
    }

    if (showDisplayCategorySuggestions || showDisplaySubcategorySuggestions || showProfileTypeSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDisplayCategorySuggestions, showDisplaySubcategorySuggestions, showProfileTypeSuggestions])

  const hasOverlayOpen = isServicePaymentOpen || isVenueSettingsPanelOpen || isVenuePaymentOpen || isVenueOpeningDaysOpen

  useEffect(() => {
    if (!hasOverlayOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [hasOverlayOpen])

  useEffect(() => {
    if ((!isVenueSettingsPanelOpen && !isVenuePaymentOpen && !isVenueOpeningDaysOpen) || typeof window === 'undefined') {
      setKeyboardInset(0)
      return
    }
    const viewport = window.visualViewport
    if (!viewport) return

    const updateInset = () => {
      const nextInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
      )
      setKeyboardInset(nextInset)
    }

    updateInset()
    viewport.addEventListener('resize', updateInset)
    viewport.addEventListener('scroll', updateInset)

    return () => {
      viewport.removeEventListener('resize', updateInset)
      viewport.removeEventListener('scroll', updateInset)
      setKeyboardInset(0)
    }
  }, [isVenueSettingsPanelOpen, isVenuePaymentOpen, isVenueOpeningDaysOpen])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5242880) { // 5MB
      alert('L\'image est trop volumineuse (max 5MB)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.')
      return
    }

    setUploadingAvatar(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`
      
      // Supprimer l'ancienne photo si elle existe
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('posts').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        alert('Erreur lors du téléchargement de la photo')
        setUploadingAvatar(false)
        return
      }

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      if (data?.publicUrl) {
        setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }))
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Erreur lors du téléchargement de la photo')
    }

    setUploadingAvatar(false)
  }


  const profileTypeOptions = useMemo(() => ([
    { id: 'creator', label: 'Créateur(trice) de contenu' },
    { id: 'freelance', label: 'Prestataire / Freelance' },
    { id: 'company', label: 'Entreprise' },
    { id: 'studio', label: 'Studio / Lieu' },
    { id: 'institut', label: 'Institut / Beauté' },
    { id: 'community-manager', label: 'Community manager' },
    { id: 'monteur', label: 'Monteur(euse)' },
    { id: 'animateur', label: 'Animateur(rice)' },
    { id: 'redacteur', label: 'Rédacteur(rice)' },
    { id: 'scenariste', label: 'Scénariste' },
    { id: 'coach', label: 'Coach' },
    { id: 'agence', label: 'Agence' },
    { id: 'branding', label: 'Branding' },
    { id: 'analyse-profil', label: 'Analyse de profil' },
    { id: 'other', label: 'Autre' }
  ]), [])

  const serviceNameOptions = useMemo(() => {
    const servicesCategory = publicationTypes.find(category => category.slug === 'services')
    if (!servicesCategory) return []
    return servicesCategory.subcategories
      .filter(sub => sub.id !== 'tout' && sub.id !== 'autre')
      .map(sub => sub.name)
  }, [])

  const filteredServiceNameOptions = useMemo(() => {
    const search = serviceForm.name.trim().toLowerCase()
    if (!search) return serviceNameOptions
    return serviceNameOptions.filter(option => option.toLowerCase().includes(search))
  }, [serviceForm.name, serviceNameOptions])

  const displayCategoryOptions = useMemo(() => (
    publicationTypes.map(category => ({
      id: category.slug,
      label: t(`categories:titles.${category.slug}`, { defaultValue: category.name })
    }))
  ), [t])

  const displayCategoryLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    displayCategoryOptions.forEach(option => map.set(option.id, option.label))
    return map
  }, [displayCategoryOptions])

  const displaySubcategoryOptionsByCategory = useMemo(() => {
    const map = new Map<string, Array<{ id: string; key: string; label: string }>>()
    publicationTypes.forEach((category) => {
      const options = category.subcategories
        .filter((sub) => sub.slug !== 'tout')
        .map((sub) => ({
          id: sub.slug,
          key: `${category.slug}::${sub.slug}`,
          label: sub.name
        }))
      map.set(category.slug, options)
    })
    return map
  }, [])

  const selectedDisplaySubcategoryCategory = useMemo(() => {
    if (
      activeDisplaySubcategoryCategory &&
      profile.display_categories.includes(activeDisplaySubcategoryCategory)
    ) {
      return activeDisplaySubcategoryCategory
    }
    return profile.display_categories[0] || null
  }, [activeDisplaySubcategoryCategory, profile.display_categories])

  const filteredDisplayCategoryOptions = useCallback(() => {
    if (!displayCategorySearch.trim()) {
      return displayCategoryOptions
    }
    const searchLower = displayCategorySearch.toLowerCase()
    return displayCategoryOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [displayCategorySearch, displayCategoryOptions])

  const filteredDisplaySubcategoryOptions = useCallback(() => {
    if (!selectedDisplaySubcategoryCategory) return []
    const base = displaySubcategoryOptionsByCategory.get(selectedDisplaySubcategoryCategory) || []
    if (!displaySubcategorySearch.trim()) return base
    const searchLower = displaySubcategorySearch.toLowerCase()
    return base.filter((option) => option.label.toLowerCase().includes(searchLower))
  }, [selectedDisplaySubcategoryCategory, displaySubcategoryOptionsByCategory, displaySubcategorySearch])

  const filteredProfileTypeOptions = useCallback(() => {
    if (!profileTypeSearch.trim()) {
      return profileTypeOptions
    }
    const searchLower = profileTypeSearch.toLowerCase()
    return profileTypeOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [profileTypeSearch, profileTypeOptions])

  const handleAddDisplayCategory = (categorySlug: string) => {
    if (!profile.display_categories.includes(categorySlug)) {
      setProfile(prev => ({
        ...prev,
        display_categories: [...prev.display_categories, categorySlug]
      }))
    }
    setDisplayCategorySearch('')
    setShowDisplayCategorySuggestions(false)
    setActiveDisplaySubcategoryCategory(categorySlug)
    setShowDisplaySubcategorySuggestions(true)
  }

  const handleRemoveDisplayCategory = (categorySlug: string) => {
    setProfile(prev => ({
      ...prev,
      display_categories: prev.display_categories.filter(cat => cat !== categorySlug),
      display_subcategories: prev.display_subcategories.filter(
        (item) => !item.startsWith(`${categorySlug}::`)
      )
    }))
  }

  const toggleDisplaySubcategory = (categorySlug: string, subcategorySlug: string) => {
    const key = `${categorySlug}::${subcategorySlug}`
    setProfile((prev) => {
      const exists = prev.display_subcategories.includes(key)
      return {
        ...prev,
        display_subcategories: exists
          ? prev.display_subcategories.filter((item) => item !== key)
          : [...prev.display_subcategories, key]
      }
    })
    setDisplaySubcategorySearch('')
  }

  const MAX_PROFILE_TYPES = 2
  const knownProfileTypeIds = useMemo(() => new Set(profileTypeOptions.map((option) => option.id)), [profileTypeOptions])
  const customSelectedProfileTypes = useMemo(
    () => profile.profile_types.filter((typeId) => !knownProfileTypeIds.has(typeId)),
    [profile.profile_types, knownProfileTypeIds]
  )

  const handleAddProfileType = (typeId: string) => {
    if (!typeId) return
    if (typeId === 'other') {
      setShowCustomProfileTypeInput(true)
      setCustomProfileType('')
      setProfileTypeSearch('')
      setShowProfileTypeSuggestions(false)
      return
    }
    if (profile.profile_types.length >= MAX_PROFILE_TYPES) {
      showError('Vous pouvez choisir 2 statuts maximum')
      return
    }
    if (profile.profile_types.includes(typeId)) {
      setProfileTypeSearch('')
      setShowProfileTypeSuggestions(false)
      return
    }
    setProfile(prev => ({ ...prev, profile_types: [...prev.profile_types, typeId] }))
    setProfileTypeSearch('')
    setShowProfileTypeSuggestions(false)
  }

  const handleRemoveProfileType = (typeId: string) => {
    setProfile(prev => ({
      ...prev,
      profile_types: prev.profile_types.filter(type => type !== typeId)
    }))
  }

  const handleConfirmCustomProfileType = () => {
    const trimmed = customProfileType.trim()
    if (!trimmed) {
      showError('Précisez votre statut')
      return
    }
    if (profile.profile_types.length >= MAX_PROFILE_TYPES) {
      showError('Vous pouvez choisir 2 statuts maximum')
      return
    }
    if (!profile.profile_types.includes(trimmed)) {
      setProfile(prev => ({ ...prev, profile_types: [...prev.profile_types, trimmed] }))
    }
    setCustomProfileType('')
    setShowCustomProfileTypeInput(false)
  }

  const normalizeServicePaymentType = (value: string) => {
    if (value === 'price') return 'remuneration'
    if (value === 'exchange') return 'echange'
    return value
  }

  const handleOpenServiceModal = (index?: number) => {
    if (index !== undefined && index !== null) {
      // Modifier un service existant
      setEditingServiceIndex(index)
      const existingService = profile.services[index]
      setServiceForm({
        ...existingService,
        payment_type: normalizeServicePaymentType(existingService.payment_type)
      })
      } else {
      // Ajouter un nouveau service
      setEditingServiceIndex(null)
      setServiceForm({
        name: '',
        description: '',
        payment_type: '',
        value: ''
      })
    }
    setShowServiceNameSuggestions(false)
    setIsServicePaymentOpen(false)
    setShowServiceModal(true)
  }

  const handleCloseServiceModal = () => {
    setShowServiceModal(false)
    setEditingServiceIndex(null)
    setServiceForm({
      name: '',
      description: '',
      payment_type: '',
      value: ''
    })
    setShowServiceNameSuggestions(false)
    setIsServicePaymentOpen(false)
  }

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) {
      alert('Le nom du service est obligatoire')
      return
    }

    if (!serviceForm.payment_type) {
      alert('Le mode de paiement est obligatoire')
      return
    }

    const paymentConfig = getPaymentOptionConfig(serviceForm.payment_type)
    const requiresPrice = !!paymentConfig?.requiresPrice
    const requiresExchangeService = !!paymentConfig?.requiresExchangeService
    const requiresPercentage = !!paymentConfig?.requiresPercentage

    if ((requiresPrice || requiresExchangeService || requiresPercentage) && !serviceForm.value.trim()) {
      if (requiresPrice) {
        alert('Le prix est obligatoire')
      } else if (requiresPercentage) {
        alert('Le pourcentage est obligatoire')
      } else {
        alert('La description de l\'échange est obligatoire')
      }
      return
    }

    if (!user) return

    const updatedService = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      payment_type: serviceForm.payment_type,
      value: serviceForm.value.trim()
    }

    let updatedServices: Array<{ name: string; description: string; payment_type: string; value: string }>
    
    if (editingServiceIndex !== null) {
      // Modifier un service existant
      updatedServices = profile.services.map((s, i) =>
        i === editingServiceIndex ? updatedService : s
      )
    } else {
      // Ajouter un nouveau service
      updatedServices = [...profile.services, updatedService]
    }

    // Mettre à jour l'état local
    setProfile(prev => ({
      ...prev,
      services: updatedServices
    }))

    // Sauvegarder immédiatement dans la base de données
    try {
      console.log(`💾 Sauvegarde automatique de ${updatedServices.length} services:`, updatedServices)
      // Toujours sauvegarder le tableau, même s'il est vide, pour écraser la valeur existante
      const servicesToSave = updatedServices.length > 0 ? updatedServices : []
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          services: servicesToSave,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('❌ Erreur lors de la sauvegarde automatique:', profileError)
        alert('Erreur lors de la sauvegarde du service')
      } else {
        console.log('✅ Service sauvegardé automatiquement avec succès')
        showSuccess('Service enregistré')
      }
    } catch (err) {
      console.error('Error saving service:', err)
      alert('Erreur lors de la sauvegarde du service')
    }

    handleCloseServiceModal()
  }

  const handleRemoveService = async (index: number) => {
    confirmation.confirm(
      {
        title: 'Supprimer le service',
        message: 'Êtes-vous sûr de vouloir supprimer ce service ?',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        isDestructive: true
      },
      async () => {
        if (!user) return

        const updatedServices = profile.services.filter((_, i) => i !== index)
        
        // Mettre à jour l'état local
        setProfile(prev => ({
          ...prev,
          services: updatedServices
        }))

        // Sauvegarder immédiatement dans la base de données
        try {
          console.log(`💾 Sauvegarde automatique après suppression: ${updatedServices.length} services restants`)
          // Toujours sauvegarder le tableau, même s'il est vide, pour écraser la valeur existante
          const servicesToSave = updatedServices.length > 0 ? updatedServices : []
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: profileError } = await (supabase.from('profiles') as any)
            .upsert({
              id: user.id,
              services: servicesToSave,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.error('❌ Erreur lors de la sauvegarde automatique:', profileError)
            alert('Erreur lors de la suppression du service')
            // Restaurer l'état en cas d'erreur
            setProfile(prev => ({
              ...prev,
              services: profile.services
            }))
          } else {
            console.log('✅ Service supprimé et sauvegardé automatiquement')
            showSuccess('Service supprimé')
          }
        } catch (err) {
          console.error('Error removing service:', err)
          alert('Erreur lors de la suppression du service')
          // Restaurer l'état en cas d'erreur
          setProfile(prev => ({
            ...prev,
            services: profile.services
          }))
        }
      }
    )
  }

  // Convertir le tableau de liens sociaux en objet pour la base de données
  const convertSocialLinksToObject = (links: string[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    const keys = ['website', 'instagram', 'linkedin'] as const
    keys.forEach((key, i) => {
      const value = (links[i] || '').trim()
      if (value) obj[key] = value
    })
    return obj
  }

  const ensureSocialLinksLength = (arr: string[]) => {
    const next = [...arr]
    while (next.length < 3) next.push('')
    return next.slice(0, 3)
  }

  const filledLinkCount = useMemo(() => {
    const links = ensureSocialLinksLength(profile.socialLinks)
    return links.filter((l) => (l || '').trim()).length
  }, [profile.socialLinks])

  const handleConfirmAddLink = () => {
    const url = (linkInputValue || '').trim()
    if (!url) return
    const links = ensureSocialLinksLength(profile.socialLinks)
    const emptyIndex = links.findIndex((l) => !(l || '').trim())
    if (emptyIndex < 0) return
    links[emptyIndex] = url
    setProfile((prev) => ({ ...prev, socialLinks: links }))
    setLinkInputValue('')
    setShowLinkInput(false)
  }

  const handleRemoveLink = (index: number) => {
    confirmation.confirm(
      {
        title: 'Supprimer le lien',
        message: 'Voulez-vous vraiment supprimer ce lien ?',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        isDestructive: true
      },
      () => {
        const links = ensureSocialLinksLength(profile.socialLinks)
        links[index] = ''
        setProfile((prev) => ({ ...prev, socialLinks: links }))
      }
    )
  }

  const handleSave = () => {
    if (!user) return

    // Vérifier le consentement avant de sauvegarder
    profileConsent.requireConsent(async () => {
      await performSave()
    })
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  const handleSaveConfirmSave = useCallback(() => {
    setShowSaveConfirmModal(false)
    pendingNavigateTargetRef.current = null
    handleSaveRef.current()
  }, [])

  const performSave = async () => {
    if (!user) return

    if (!profile.bio.trim()) {
      showError('La bio est obligatoire')
      return
    }

    setSaving(true)
    
    try {
      if (isVenueDisplayCategory) {
        if (!selectedVenuePaymentType) {
          showError('Choisissez un moyen de paiement pour le lieu')
          setSaving(false)
          return
        }

        if (selectedVenuePaymentType === 'remuneration') {
          const price = Number(selectedVenuePaymentValue)
          if (!selectedVenuePaymentValue || Number.isNaN(price) || price <= 0) {
            showError('Ajoutez un prix valide pour la rémunération')
            setSaving(false)
            return
          }
        }

        if (selectedVenuePaymentType === 'visibilite-contre-service') {
          const freeHours = Number(selectedVenuePaymentValue)
          if (!selectedVenuePaymentValue || Number.isNaN(freeHours) || freeHours <= 0) {
            showError('Ajoutez un nombre d’heures gratuites valide')
            setSaving(false)
            return
          }
        }
      }

      // 1. Mettre à jour auth.users pour full_name et username
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name || null,
          username: profile.username || null
        }
      })

      if (authError) {
        console.error('Error updating auth user:', authError)
        alert('Erreur lors de la mise à jour des informations d\'authentification')
        setSaving(false)
        return
      }

      // 2. Mettre à jour les autres champs dans profiles
      console.log(`💾 Sauvegarde de ${profile.services.length} services:`, profile.services)
      
      // Préparer les données pour la sauvegarde
      // Toujours sauvegarder les tableaux (même vides) pour écraser les valeurs existantes
      const servicesToSave = profile.services.length > 0 ? profile.services : []
      const skillsToSave = profile.skills.length > 0 ? profile.skills : []
      const profileTypesToSave = profile.profile_types.length > 0
        ? JSON.stringify(profile.profile_types)
        : null
      const venueBillingHoursToSave = timeToMinutes(formatTime(profile.venue_billing_hours || '01:00'))
      console.log(`💾 Services à sauvegarder (${profile.services.length}):`, servicesToSave)
      
      const baseProfilePayload = {
        id: user.id,
        email: profile.email,
        phone: profile.phone || null,
        bio: profile.bio || null,
        location: profile.location || null,
        avatar_url: profile.avatar_url || null,
        skills: skillsToSave,
        display_categories: profile.display_categories,
        display_subcategories: profile.display_subcategories,
        profile_type: profileTypesToSave,
        services: servicesToSave,
        venue_opening_hours: profile.venue_opening_hours,
        venue_billing_hours: venueBillingHoursToSave,
        venue_payment_types: profile.venue_payment_types,
        social_links: convertSocialLinksToObject(profile.socialLinks),
        phone_verified: profile.phone_verified,
        updated_at: new Date().toISOString()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { error: profileError, data: savedData } = await (supabase.from('profiles') as any)
        .upsert({
          ...baseProfilePayload,
          show_in_users: profile.show_in_users
        })
        .select()

      const profileErrorMessage = String((profileError as { message?: string } | null)?.message || '').toLowerCase()
      if (profileError && (profileErrorMessage.includes('show_in_users') || profileErrorMessage.includes('display_subcategories'))) {
        // Fallback si la colonne n'existe pas encore dans cet environnement
        const retryPayload = {
          ...baseProfilePayload
        }
        if (profileErrorMessage.includes('display_subcategories')) {
          delete (retryPayload as Record<string, unknown>).display_subcategories
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retry = await (supabase.from('profiles') as any)
          .upsert(retryPayload)
          .select()
        profileError = retry.error
        savedData = retry.data
      }

      if (profileError) {
        console.error('❌ Erreur lors de la sauvegarde:', profileError)
        alert('Erreur lors de la mise à jour du profil')
      } else {
        console.log('✅ Profil sauvegardé avec succès:', savedData)
        if (savedData && savedData[0]) {
          console.log(`✅ Services sauvegardés: ${savedData[0].services?.length || 0}`, savedData[0].services)
        }
        showSuccess('Validé')
        // Petit délai pour laisser le toast s'afficher avant la navigation
        setTimeout(() => {
          navigate('/profile/public')
        }, 500)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Erreur lors de la mise à jour du profil')
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Éditer le profil" onBackClick={handleBackClick} />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page">
        <PageHeader title="Éditer le profil" onBackClick={handleBackClick} />
        <div className="page-content edit-public-profile-page">
          <div className="edit-public-profile-container">
            <div className="empty-state">
              <p>Connexion requise</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const missingCompletionSections = {
    avatar: !profile.avatar_url,
    location: !profile.location.trim(),
    bio: !profile.bio.trim(),
    categories: profile.display_categories.length === 0,
    status: profile.profile_types.length === 0,
    link: !profile.socialLinks.some((l) => (l || '').trim()),
    venue_opening_hours: isVenueDisplayCategory && !profile.venue_opening_hours.some((slot) => slot.enabled),
    services_required: isServicesDisplayCategory && profile.services.length === 0
  }

  return (
    <div className="page">
      <PageHeader title="Éditer le profil" onBackClick={handleBackClick} />
      <div className="page-content edit-public-profile-page">
        <div className="edit-public-profile-spacer" />
        <div className="edit-public-profile-container">
          <div className="form-section">
            {/* Photo de profil */}
            <div className={`form-group ${fromProfileProgress && missingCompletionSections.avatar ? 'profile-progress-missing' : ''}`}>
              <label>Photo de profil</label>
              <div className="avatar-upload-section">
                <div className="avatar-preview">
                  <img
                    src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'User')}`}
                    alt="Avatar"
                    className="avatar-preview-image"
                  />
                  {uploadingAvatar && (
                    <div className="avatar-upload-overlay">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="avatar-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera size={18} />
                  {uploadingAvatar ? 'Téléchargement...' : 'Modifier la photo'}
                </button>
              </div>
            </div>

            {/* Nom / Pseudo */}
            <div className="form-group">
              <label htmlFor="full_name">Nom</label>
              <input
                type="text"
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Pseudo</label>
              <input
                type="text"
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Votre pseudo"
              />
            </div>

            {/* Localisation */}
            <div className={`form-group edit-profile-location-group ${fromProfileProgress && missingCompletionSections.location ? 'profile-progress-missing' : ''}`}>
              <label htmlFor="location">Ville</label>
              <LocationAutocomplete
                value={profile.location}
                onChange={(value) => setProfile(prev => ({ ...prev, location: value }))}
                onLocationSelect={(location) => {
                  setProfile(prev => ({
                    ...prev,
                    location: location.city || location.address.split(',')[0].trim() || location.address
                  }))
                }}
                placeholder="Trouver votre ville"
              />
            </div>

            {/* Bio & Description */}
            <div className={`form-group ${fromProfileProgress && missingCompletionSections.bio ? 'profile-progress-missing' : ''}`}>
              <label htmlFor="bio">Bio *</label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous en quelques mots..."
                rows={4}
                maxLength={500}
              />
              <div className="char-count">{profile.bio.length}/500</div>
            </div>

            {/* Statuts */}
            <div className={`form-group ${fromProfileProgress && missingCompletionSections.status ? 'profile-progress-missing' : ''}`}>
              <label>Statuts</label>

              <div className="interest-search-container" ref={profileTypeSearchRef}>
                <div className="interest-search-wrapper">
                  <input
                    type="text"
                    className="interest-search-input"
                    value={profileTypeSearch}
                    onChange={(e) => {
                      setProfileTypeSearch(e.target.value)
                      setShowProfileTypeSuggestions(true)
                    }}
                    onFocus={() => setShowProfileTypeSuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const exactMatch = filteredProfileTypeOptions().find(
                          opt => opt.label.toLowerCase() === profileTypeSearch.toLowerCase()
                        )
                        if (exactMatch) {
                          handleAddProfileType(exactMatch.id)
                        }
                      }
                    }}
                    placeholder="Choisir un statut (max 2)"
                  />
                </div>

                {showProfileTypeSuggestions && (
                  <div className="interest-suggestions">
                    {filteredProfileTypeOptions().length > 0 ? (
                      <>
                        {filteredProfileTypeOptions().map((option) => {
                          const isAlreadyAdded = profile.profile_types.includes(option.id)
                          const isLimitReached = profile.profile_types.length >= MAX_PROFILE_TYPES
                          const isDisabled = !isAlreadyAdded && isLimitReached
                          return (
                          <button
                            key={option.id}
                            type="button"
                            className={`interest-suggestion-item ${isAlreadyAdded ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => {
                              if (isDisabled) return
                              if (isAlreadyAdded) {
                                handleRemoveProfileType(option.id)
                                return
                              }
                              handleAddProfileType(option.id)
                            }}
                            disabled={isDisabled}
                          >
                            {option.label}
                            {isAlreadyAdded && (
                              <span className="interest-selected-indicator" aria-label="Sélectionné">
                                <Check size={14} />
                              </span>
                            )}
                          </button>
                        )})}
                      </>
                    ) : (
                      <div className="interest-suggestion-item no-results">
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
              {customSelectedProfileTypes.length > 0 && (
                <div className="profile-inline-selected-row" aria-label="Statuts personnalisés sélectionnés">
                  {customSelectedProfileTypes.map((typeId) => (
                    <button
                      key={typeId}
                      type="button"
                      className="profile-inline-selected-pill"
                      onClick={() => handleRemoveProfileType(typeId)}
                      title="Retirer ce statut personnalisé"
                    >
                      <Check size={14} />
                      <span>{typeId}</span>
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}
              {showCustomProfileTypeInput && (
                <div className="custom-status-row">
                  <input
                    type="text"
                    className="custom-status-input"
                    value={customProfileType}
                    onChange={(e) => setCustomProfileType(e.target.value)}
                    placeholder="Précisez votre statut"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleConfirmCustomProfileType()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="custom-status-button"
                    onClick={handleConfirmCustomProfileType}
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Catégories d'affichage */}
            <div className={`form-group compact-top ${fromProfileProgress && missingCompletionSections.categories ? 'profile-progress-missing' : ''}`}>
              <label>Catégories d'affichage</label>

              <div className="interest-search-container" ref={displayCategorySearchRef}>
                <div className="interest-search-wrapper">
                  <input
                    type="text"
                    className="interest-search-input"
                    value={displayCategorySearch}
                    onChange={(e) => {
                      setDisplayCategorySearch(e.target.value)
                      setShowDisplayCategorySuggestions(true)
                    }}
                    onFocus={() => setShowDisplayCategorySuggestions(true)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const exactMatch = filteredDisplayCategoryOptions().find(
                          opt => opt.label.toLowerCase() === displayCategorySearch.toLowerCase()
                        )
                        if (exactMatch) {
                          handleAddDisplayCategory(exactMatch.id)
                        }
                      }
                    }}
                    placeholder="Choisir une catégorie"
                  />
                </div>

                {showDisplayCategorySuggestions && (
                  <div className="interest-suggestions">
                    {filteredDisplayCategoryOptions().length > 0 ? (
                      <>
                        {filteredDisplayCategoryOptions().map((option) => {
                          const isAlreadyAdded = profile.display_categories.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`interest-suggestion-item ${isAlreadyAdded ? 'selected' : ''}`}
                              onClick={() => {
                                if (isAlreadyAdded) {
                                  handleRemoveDisplayCategory(option.id)
                                } else {
                                  handleAddDisplayCategory(option.id)
                                }
                              }}
                            >
                              {option.label}
                              {isAlreadyAdded && (
                                <span className="interest-selected-indicator" aria-label="Sélectionné">
                                  <Check size={14} />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </>
                    ) : (
                      <div className="interest-suggestion-item no-results">
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {profile.display_categories.length > 0 && (
              <div className="form-group compact-top">
                <label>Sous-catégories (optionnel)</label>

                <div className="profile-subcategory-category-switcher">
                  {profile.display_categories.map((categorySlug) => (
                    <button
                      key={categorySlug}
                      type="button"
                      className={`profile-subcategory-category-chip ${selectedDisplaySubcategoryCategory === categorySlug ? 'active' : ''}`}
                      onClick={() => {
                        setActiveDisplaySubcategoryCategory(categorySlug)
                        setShowDisplaySubcategorySuggestions(true)
                      }}
                    >
                      {displayCategoryLabelMap.get(categorySlug) || categorySlug}
                    </button>
                  ))}
                </div>

                {selectedDisplaySubcategoryCategory && (
                  <div className="interest-search-container profile-subcategory-search-container" ref={displaySubcategorySearchRef}>
                    <div className="interest-search-wrapper">
                      <input
                        type="text"
                        className="interest-search-input"
                        value={displaySubcategorySearch}
                        onChange={(e) => {
                          setDisplaySubcategorySearch(e.target.value)
                          setShowDisplaySubcategorySuggestions(true)
                        }}
                        onFocus={() => setShowDisplaySubcategorySuggestions(true)}
                        placeholder={`Choisir une sous-catégorie (${displayCategoryLabelMap.get(selectedDisplaySubcategoryCategory) || selectedDisplaySubcategoryCategory})`}
                      />
                    </div>

                    {showDisplaySubcategorySuggestions && (
                      <div className="interest-suggestions">
                        {filteredDisplaySubcategoryOptions().length > 0 ? (
                          filteredDisplaySubcategoryOptions().map((option) => {
                            const isSelected = profile.display_subcategories.includes(option.key)
                            return (
                              <button
                                key={option.key}
                                type="button"
                                className={`interest-suggestion-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (!selectedDisplaySubcategoryCategory) return
                                  toggleDisplaySubcategory(selectedDisplaySubcategoryCategory, option.id)
                                }}
                              >
                                {option.label}
                                {isSelected && (
                                  <span className="interest-selected-indicator" aria-label="Sélectionné">
                                    <Check size={14} />
                                  </span>
                                )}
                              </button>
                            )
                          })
                        ) : (
                          <div className="interest-suggestion-item no-results">
                            Aucune sous-catégorie trouvée
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isVenueDisplayCategory &&
              selectedDisplaySubcategoryCategory &&
              VENUE_CATEGORY_SLUGS.includes(selectedDisplaySubcategoryCategory) && (
              <div className={`form-group venue-settings-entry-group ${fromProfileProgress && missingCompletionSections.venue_opening_hours ? 'profile-progress-missing' : ''}`}>
                <button
                  type="button"
                  className="venue-settings-entry-button"
                  onClick={() => setIsVenueSettingsPanelOpen(true)}
                >
                  <span className="venue-settings-entry-title">
                    {selectedVenueOpeningDays.length > 0 ? 'Modifier vos jours ouvrables' : 'Ajouter vos jours ouvrables'}
                  </span>
                  <span className="venue-settings-entry-subtitle">
                    {selectedVenueOpeningDays.length > 0
                      ? `${selectedVenueOpeningDays.length} jour(s) configuré(s)${selectedVenuePaymentType ? ' · paiement configuré' : ''}`
                      : 'Cliquez pour configurer les horaires et le moyen de paiement'}
                  </span>
                </button>

                {selectedVenueOpeningDays.length > 0 && (
                  <div className="opening-hours-summary">
                    {selectedVenueOpeningDays.map((slot) => (
                      <span key={slot.day} className="opening-hours-summary-chip">
                        {venueDayLabels[slot.day] || slot.day}: {slot.start} - {slot.end}
                      </span>
                    ))}
                  </div>
                )}

                {renderVenueBottomSheet(
                  isVenueSettingsPanelOpen,
                  () => setIsVenueSettingsPanelOpen(false),
                  '',
                  <div className="venue-settings-sheet-content">
                    <div className="opening-hours-sheet-header">
                      <h3>Configurer le lieu</h3>
                      <button
                        type="button"
                        className="opening-hours-sheet-close"
                        onClick={() => setIsVenueSettingsPanelOpen(false)}
                        aria-label="Fermer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="opening-hours-sheet-divider" />

                    <div className="form-group venue-settings-group">
                      <div className="form-group dropdown-field venue-dropdown-field">
                        <label className="form-label">Moyen de paiement *</label>
                        <button
                          type="button"
                          className={`dropdown-trigger ${isVenuePaymentOpen ? 'open' : ''}`}
                          onClick={() => setIsVenuePaymentOpen((prev) => !prev)}
                        >
                          <span>{selectedVenuePaymentName}</span>
                          <span className="dropdown-caret" aria-hidden="true" />
                        </button>
                        {renderVenueBottomSheet(
                          isVenuePaymentOpen,
                          () => setIsVenuePaymentOpen(false),
                          'Choisissez un moyen de paiement',
                          <CustomList
                            items={venuePaymentOptions}
                            selectedId={selectedVenuePaymentType}
                            onSelectItem={(optionId) => {
                              setVenuePaymentType(optionId)
                              setIsVenuePaymentOpen(false)
                            }}
                            className="payment-options-list publish-list"
                            showCheckbox={false}
                            showDescription
                            truncateDescription={false}
                          />
                        )}
                      </div>

                      {selectedVenuePaymentType === 'remuneration' && (
                        <div className="form-group venue-payment-value-group">
                          <label className="form-label">Prix *</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="0.01"
                            placeholder="Ex: 50"
                            value={selectedVenuePaymentValue}
                            onChange={(event) => setVenuePaymentValue(event.target.value)}
                          />
                        </div>
                      )}

                      {selectedVenuePaymentType === 'visibilite-contre-service' && (
                        <div className="form-group venue-payment-value-group">
                          <label className="form-label">Heures offertes (gratuit) *</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0.5"
                            step="0.5"
                            placeholder="Ex: 2"
                            value={selectedVenuePaymentValue}
                            onChange={(event) => setVenuePaymentValue(event.target.value)}
                          />
                        </div>
                      )}

                      <div className="form-group venue-opening-group">
                        <label className="form-label">Jours et horaires d'ouverture *</label>
                        <div className="dropdown-field venue-dropdown-field">
                          <button
                            type="button"
                            className={`dropdown-trigger ${isVenueOpeningDaysOpen ? 'open' : ''}`}
                            onClick={() => setIsVenueOpeningDaysOpen((prev) => !prev)}
                          >
                            <span>
                              {selectedVenueOpeningDays.length > 0
                                ? `${selectedVenueOpeningDays.length} jour(s) sélectionné(s)`
                                : 'Choisir les jours d’ouverture'}
                            </span>
                            <span className="dropdown-caret" aria-hidden="true" />
                          </button>
                          {renderVenueBottomSheet(
                            isVenueOpeningDaysOpen,
                            () => setIsVenueOpeningDaysOpen(false),
                            '',
                            <div className="opening-hours-sheet-content">
                              <div className="opening-hours-sheet-header">
                                <h3>Jours d’ouverture</h3>
                                <button
                                  type="button"
                                  className="opening-hours-sheet-close"
                                  onClick={() => setIsVenueOpeningDaysOpen(false)}
                                  aria-label="Fermer"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="opening-hours-sheet-divider" />
                              <div className="opening-days-list">
                                {profile.venue_opening_hours.map((slot) => (
                                  <div
                                    key={slot.day}
                                    className={`opening-day-item ${slot.enabled ? 'selected' : ''}`}
                                  >
                                    <button
                                      type="button"
                                      className="opening-day-row"
                                      onClick={() => toggleVenueOpeningDay(slot.day)}
                                    >
                                      <span>{venueDayLabels[slot.day] || slot.day}</span>
                                      <span className={`opening-day-check ${slot.enabled ? 'checked' : ''}`} aria-hidden="true">
                                        <span className="opening-day-checkmark">✓</span>
                                      </span>
                                    </button>
                                    {slot.enabled && (
                                      <div className="opening-day-hours-inline">
                                        <label className="opening-hours-time-label">Entre quelle heure et quelle heure ?</label>
                                        <div className="opening-day-hours-grid">
                                          <div className="opening-hours-time-block">
                                            <span className="opening-hours-time-label">De</span>
                                            <div className="time-input-row">
                                              <input
                                                type="text"
                                                className="form-input opening-hours-time"
                                                value={slot.start}
                                                onChange={(event) =>
                                                  updateVenueDay(slot.day, { start: normalizeTime(event.target.value) })
                                                }
                                                onBlur={() =>
                                                  updateVenueDay(slot.day, { start: formatTime(slot.start || '09:00') })
                                                }
                                                placeholder="HH:MM"
                                                inputMode="numeric"
                                              />
                                              <div className="time-stepper">
                                                <button
                                                  type="button"
                                                  className="time-stepper-btn"
                                                  onClick={() => stepVenueTime(slot.day, 'start', 30)}
                                                  aria-label="Augmenter de 30 minutes"
                                                >
                                                  <ChevronUp size={14} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="time-stepper-btn"
                                                  onClick={() => stepVenueTime(slot.day, 'start', -30)}
                                                  aria-label="Diminuer de 30 minutes"
                                                >
                                                  <ChevronDown size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="opening-hours-time-block">
                                            <span className="opening-hours-time-label">À</span>
                                            <div className="time-input-row">
                                              <input
                                                type="text"
                                                className="form-input opening-hours-time"
                                                value={slot.end}
                                                onChange={(event) =>
                                                  updateVenueDay(slot.day, { end: normalizeTime(event.target.value) })
                                                }
                                                onBlur={() =>
                                                  updateVenueDay(slot.day, { end: formatTime(slot.end || '18:00') })
                                                }
                                                placeholder="HH:MM"
                                                inputMode="numeric"
                                              />
                                              <div className="time-stepper">
                                                <button
                                                  type="button"
                                                  className="time-stepper-btn"
                                                  onClick={() => stepVenueTime(slot.day, 'end', 30)}
                                                  aria-label="Augmenter de 30 minutes"
                                                >
                                                  <ChevronUp size={14} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="time-stepper-btn"
                                                  onClick={() => stepVenueTime(slot.day, 'end', -30)}
                                                  aria-label="Diminuer de 30 minutes"
                                                >
                                                  <ChevronDown size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>,
                            'opening-hours-sheet'
                          )}
                        </div>
                      </div>

                      <div className="venue-settings-sheet-actions">
                        <button
                          type="button"
                          className="venue-settings-sheet-save"
                          onClick={() => setIsVenueSettingsPanelOpen(false)}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>,
                  'venue-settings-sheet'
                )}
              </div>
            )}

            {/* Services */}
            <div className={`form-group ${fromProfileProgress && missingCompletionSections.services_required ? 'profile-progress-missing' : ''}`}>
              <label>Services</label>
              <p className="form-hint">Cliquez sur un service pour le modifier</p>
              
              {/* Liste des services ajoutés */}
              <div className="tags-list">
                {profile.services.map((service, originalIndex) => {
                  // Extraire uniquement le nom du service
                  let serviceName = ''
                  
                  if (!service) return null
                  
                  if (typeof service === 'string') {
                    // Si c'est une string, vérifier si c'est du JSON
                    const serviceStr: string = service
                    try {
                      const parsed = JSON.parse(serviceStr)
                      if (typeof parsed === 'string') {
                        serviceName = parsed
                      } else if (parsed && typeof parsed === 'object' && parsed.name) {
                        serviceName = String(parsed.name).trim()
                      } else {
                        serviceName = serviceStr
                      }
                    } catch {
                      // Ce n'est pas du JSON, utiliser la string directement
                      serviceName = serviceStr.trim()
                    }
                  } else if (service && typeof service === 'object') {
                    // Si c'est un objet, extraire uniquement le nom
                    serviceName = String(service.name || '').trim()
                  }
                  
                  // Ne pas afficher si le nom est vide ou si ça ressemble à du JSON brut
                  if (!serviceName || serviceName.trim().length === 0 || serviceName.startsWith('{')) {
                    return null
                  }
                  
                  return (
                    <span 
                      key={originalIndex} 
                      className="tag service-tag"
                      onClick={() => handleOpenServiceModal(originalIndex)}
                    >
                      {serviceName}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveService(originalIndex)
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )
                })}
              </div>

              {/* Bouton pour ajouter un service */}
              <button
                type="button"
                className="service-add-button"
                onClick={() => handleOpenServiceModal()}
              >
                <Plus size={18} />
                Ajouter un service
              </button>
            </div>

            {/* Modal pour ajouter/modifier un service */}
            {showServiceModal && (
              <div className="service-modal-overlay" onClick={handleCloseServiceModal}>
                <div className="service-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="service-modal-header">
                    <h3>{editingServiceIndex !== null ? 'Modifier le service' : 'Ajouter un service'}</h3>
                    <button
                      type="button"
                      className="service-modal-close"
                      onClick={handleCloseServiceModal}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="service-modal-body">
                    <div className="form-group">
                      <label htmlFor="service-name">Nom du service *</label>
                      <p className="form-hint compact">
                        Choisissez un service existant ou écrivez le vôtre.
                      </p>
                      <div className="service-name-field">
                        <input
                          type="text"
                          id="service-name"
                          value={serviceForm.name}
                          onChange={(e) => {
                            setServiceForm(prev => ({ ...prev, name: e.target.value }))
                            setShowServiceNameSuggestions(true)
                          }}
                          onFocus={() => setShowServiceNameSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowServiceNameSuggestions(false), 120)
                          }}
                          placeholder="Ex: Montage, Coaching contenu..."
                        />
                        {showServiceNameSuggestions && (
                          <div className="service-name-suggestions">
                            {filteredServiceNameOptions.length > 0 ? (
                              filteredServiceNameOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className="service-name-suggestion"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    setServiceForm(prev => ({ ...prev, name: option }))
                                    setShowServiceNameSuggestions(false)
                                  }}
                                >
                                  {option}
                                </button>
                              ))
                            ) : (
                              <div className="service-name-suggestion empty">
                                Aucun service trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="service-description">Description courte (1 à 2 lignes maximum)</label>
                      <textarea
                        id="service-description"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez brièvement votre service..."
                        rows={2}
                        maxLength={200}
                      />
                      <div className="char-count">{serviceForm.description.length}/200</div>
                </div>
                    <div className="form-group dropdown-field">
                      <label className="form-label">Mode de paiement *</label>
                      <button
                        type="button"
                        className={`dropdown-trigger ${isServicePaymentOpen ? 'open' : ''}`}
                        onClick={() => setIsServicePaymentOpen((prev) => !prev)}
                      >
                        <span>
                          {getPaymentOptionConfig(serviceForm.payment_type)?.name ?? 'Choisir un moyen de paiement'}
                        </span>
                        <span className="dropdown-caret" aria-hidden="true" />
                      </button>
                      {isServicePaymentOpen && (
                        <div
                          className="service-payment-backdrop"
                          onClick={() => setIsServicePaymentOpen(false)}
                        />
                      )}
                      {isServicePaymentOpen && (
                        <div className="service-payment-panel service-payment-list">
                          <div className="service-payment-title">Choisissez votre mode de paiement</div>
                          <CustomList
                            items={getAllPaymentOptions()}
                            selectedId={serviceForm.payment_type}
                            onSelectItem={(optionId) => {
                              setServiceForm(prev => ({
                                ...prev,
                                payment_type: optionId,
                                value: ''
                              }))
                              setIsServicePaymentOpen(false)
                            }}
                            className="payment-options-list service-payment-options"
                            showCheckbox={false}
                            showDescription={false}
                          />
                        </div>
                      )}
                    </div>
                    {(() => {
                      const paymentConfig = getPaymentOptionConfig(serviceForm.payment_type)
                      const requiresPrice = !!paymentConfig?.requiresPrice
                      const requiresExchangeService = !!paymentConfig?.requiresExchangeService
                      const requiresPercentage = !!paymentConfig?.requiresPercentage
                      const shouldShowValue = requiresPrice || requiresExchangeService || requiresPercentage
                      const valueLabel = requiresPrice
                        ? 'Prix *'
                        : requiresPercentage
                          ? 'Pourcentage *'
                          : 'Valeur associée (description de l\'échange) *'
                      const valuePlaceholder = requiresPrice
                        ? 'Ex: 150€, Sur devis, Gratuit...'
                        : requiresPercentage
                          ? 'Ex: 10%'
                          : 'Décrivez ce que vous proposez en échange...'

                      if (!shouldShowValue) return null

                      return (
                        <div className="form-group">
                          <label htmlFor="service-value">{valueLabel}</label>
                          {requiresPrice || requiresPercentage ? (
                            <input
                              type="text"
                              id="service-value"
                              value={serviceForm.value}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder={valuePlaceholder}
                            />
                          ) : (
                            <textarea
                              id="service-value"
                              value={serviceForm.value}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder={valuePlaceholder}
                              rows={3}
                              maxLength={300}
                            />
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="service-modal-footer">
                    <button
                      type="button"
                      className="service-modal-cancel"
                      onClick={handleCloseServiceModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="service-modal-save"
                      onClick={handleSaveService}
                    >
                      {editingServiceIndex !== null ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liens (max 3) : icônes + barre d’ajout */}
            <div className={`form-group edit-profile-links-group ${fromProfileProgress && missingCompletionSections.link ? 'profile-progress-missing' : ''}`}>
              <label>3 liens maximum</label>
              <div className="edit-profile-links-list">
                {[0, 1, 2].map((index) => {
                  const links = ensureSocialLinksLength(profile.socialLinks)
                  const value = (links[index] || '').trim()
                  if (!value) return null
                  const platform = getLinkPlatform(value)
                  const href = value.startsWith('http') ? value : `https://${value}`
                  const iconByPlatform = {
                    instagram: <Instagram size={20} />,
                    tiktok: <div className="tiktok-icon-small">TT</div>,
                    linkedin: <Linkedin size={20} />,
                    facebook: <Facebook size={20} />,
                    twitter: <Globe size={20} />,
                    website: <Globe size={20} />
                  }
                  const platformLabels: Record<typeof platform, string> = {
                    instagram: 'Instagram',
                    tiktok: 'TikTok',
                    linkedin: 'LinkedIn',
                    facebook: 'Facebook',
                    twitter: 'Twitter / X',
                    website: 'Site web'
                  }
                  return (
                    <div key={index} className="edit-profile-link-item">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="edit-profile-link-icon-wrap"
                        aria-label={platformLabels[platform]}
                      >
                        {iconByPlatform[platform]}
                      </a>
                      <button
                        type="button"
                        className="edit-profile-link-remove"
                        onClick={() => handleRemoveLink(index)}
                        aria-label="Supprimer le lien"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
                {filledLinkCount < 3 && !showLinkInput && (
                  <button
                    type="button"
                    className="edit-profile-link-add-bar"
                    onClick={() => setShowLinkInput(true)}
                    aria-label="Ajouter un lien"
                  >
                    <Plus size={20} />
                    <span>Ajouter un lien</span>
                  </button>
                )}
                {showLinkInput && (
                  <div className="edit-profile-link-input-row">
                    <input
                      type="text"
                      inputMode="url"
                      value={linkInputValue}
                      onChange={(e) => setLinkInputValue(e.target.value)}
                      placeholder="https://..."
                      className="edit-profile-link-input"
                      autoFocus
                    />
                    <div className="edit-profile-link-input-actions">
                      <button
                        type="button"
                        className="edit-profile-link-btn edit-profile-link-btn-cancel"
                        onClick={() => {
                          setShowLinkInput(false)
                          setLinkInputValue('')
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="edit-profile-link-btn edit-profile-link-btn-confirm"
                        onClick={handleConfirmAddLink}
                        disabled={!(linkInputValue || '').trim()}
                      >
                        <Check size={16} />
                        Valider
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {filledLinkCount >= 3 && (
                <p className="form-hint compact edit-profile-links-max">3 liens maximum.</p>
              )}
            </div>

            <div className="form-group">
              <div className="profile-visibility-row">
                <div className="profile-visibility-content">
                  <label htmlFor="show-in-users-toggle">Afficher mon profil dans Utilisateurs</label>
                  <p className="form-hint compact">
                    Activé par défaut. Désactivez pour masquer votre profil de la page Utilisateurs.
                  </p>
                </div>
                <label className="profile-visibility-toggle">
                  <input
                    id="show-in-users-toggle"
                    type="checkbox"
                    checked={profile.show_in_users}
                    onChange={(e) => setProfile(prev => ({ ...prev, show_in_users: e.target.checked }))}
                  />
                  <span className="profile-visibility-toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                className="save-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de consentement pour les données personnelles */}
      <ConsentModal
        visible={profileConsent.showModal}
        title={profileConsent.messages.title}
        message={profileConsent.messages.message}
        onAccept={profileConsent.handleAccept}
        onReject={handleRejectConsent}
        onLearnMore={profileConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={profileConsent.askAgainNextTime}
        onAskAgainChange={profileConsent.setAskAgainNextTime}
      />

      {/* Modal de confirmation pour quitter sans enregistrer */}
      <SaveChangesModal
        visible={showSaveConfirmModal}
        message="Voulez-vous enregistrer vos modifications avant de quitter ?"
        onDiscard={handleSaveConfirmDiscard}
        onSave={handleSaveConfirmSave}
        discardLabel="Non"
        saveLabel="Oui"
        isSaving={saving}
      />

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
          isDestructive={confirmation.options.isDestructive}
        />
      )}
    </div>
  )
}

export default EditPublicProfile
