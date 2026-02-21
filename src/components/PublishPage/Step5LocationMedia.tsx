import { useEffect, useMemo, useState } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConsent } from '../../hooks/useConsent'
import { LocationAutocomplete } from '../Location/LocationAutocomplete'
import ConsentModal from '../ConsentModal'
import './Step5LocationMedia.css'

interface FormData {
  listingType?: 'offer' | 'request' | ''
  location: string
  location_city: string
  location_lat: number | null
  location_lng: number | null
  location_address: string
  location_visible_to_participants_only: boolean
  urgent: boolean
  images: string[]
  video: string | null
  dateFrom: string
  dateTo: string
  deadline: string
  neededTime?: string
  maxParticipants: string
  profileLevel?: string
  profileRoles?: string[]
  duration_minutes: string
  visibility: string
  externalLink?: string
  documentUrl?: string
  documentName?: string
  taggedPostId?: string
  [key: string]: any
}

interface Step5LocationMediaProps {
  formData: FormData
  onUpdateFormData: (updates: Partial<FormData>) => void
  currentPostId?: string | null
}

export const Step5LocationMedia = ({ formData, onUpdateFormData, currentPostId }: Step5LocationMediaProps) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [userPosts, setUserPosts] = useState<Array<{ id: string; title: string; image?: string | null }>>([])
  const [loadingUserPosts, setLoadingUserPosts] = useState(false)
  const [isTaggedPostOpen, setIsTaggedPostOpen] = useState(false)
  const [mediaPickerType, setMediaPickerType] = useState<'photo' | 'video'>('photo')
  const [isProfileLevelOpen, setIsProfileLevelOpen] = useState(false)
  const [isProfileRoleOpen, setIsProfileRoleOpen] = useState(false)
  const categorySlug = String(formData.category || '').toLowerCase()
  const subcategorySlug = String(formData.subcategory || '').toLowerCase()
  const isStudioLieuCategory = categorySlug === 'studio-lieu'
  const isVenteCategory = categorySlug === 'vente'
  const isCreationContenuCategory = categorySlug === 'creation-contenu'
  const isCastingCategory = categorySlug === 'casting-role' || categorySlug === 'casting'
  const isEmploiCategory = categorySlug === 'emploi' || categorySlug === 'montage' || categorySlug === 'recrutement'
  const isPosteServiceCategory = categorySlug === 'poste-service'
  const isProjetsEquipeCategory = categorySlug === 'projets-equipe'
  const isServicesCategory = categorySlug === 'services'
  const isEvenementsCategory = categorySlug === 'evenements'
  const isSuiviCategory = categorySlug === 'suivi'
  const isRequestListing = formData.listingType === 'request'
  const isEmploiRequest = isEmploiCategory && isRequestListing
  const isCastingFigurantRequest = isCastingCategory && isRequestListing && subcategorySlug === 'figurant'
  const isProjetsEquipeRequest = isProjetsEquipeCategory && isRequestListing
  const isPhotoOnlyMediaCategory =
    isStudioLieuCategory || isVenteCategory || isEmploiCategory || isPosteServiceCategory || isProjetsEquipeCategory || isServicesCategory || isEvenementsCategory || isSuiviCategory

  const profileLevelOptions = useMemo(() => ([
    'Amateur',
    'Professionnel'
  ]), [])

  const profileRoleOptions = useMemo(() => ([
    'Scénariste',
    'Rédacteur(rice)',
    'Présentateur(rice) / Animateur(rice)',
    'Journaliste / Intervieweur(se)',
    'Vidéaste',
    'Cadreur(se)',
    'Monteur(euse)',
    'Réalisateur(rice)',
    'Producteur(rice) / Chef de projet',
    'Ingé son',
    'Graphiste / Designer',
    'Directeur(rice) artistique',
    'Community manager'
  ]), [])

  const maxParticipantsNumber = Number(formData.maxParticipants) || 0

  useEffect(() => {
    if (maxParticipantsNumber <= 1 && (formData.profileRoles?.length ?? 0) > 0) {
      onUpdateFormData({ profileRoles: [] })
    }
  }, [maxParticipantsNumber, formData.profileRoles, onUpdateFormData])

  useEffect(() => {
    if (
      !isStudioLieuCategory &&
      !isVenteCategory &&
      !isCreationContenuCategory &&
      !isCastingCategory &&
      !isEmploiCategory &&
      !isPosteServiceCategory &&
      !isProjetsEquipeCategory &&
      !isServicesCategory &&
      !isEvenementsCategory &&
      !isSuiviCategory
    ) return
    if (mediaPickerType !== 'photo') {
      setMediaPickerType('photo')
    }
    const updates: Partial<FormData> = {}
    if (formData.video) updates.video = null
    if (isStudioLieuCategory || isVenteCategory || isCreationContenuCategory || isCastingCategory || isPosteServiceCategory || isServicesCategory || isEvenementsCategory || isSuiviCategory) {
      if (formData.profileLevel) updates.profileLevel = ''
    }
    if (isStudioLieuCategory || isVenteCategory || isCreationContenuCategory || isCastingCategory || isEmploiCategory || isPosteServiceCategory || isServicesCategory || isEvenementsCategory || isSuiviCategory) {
      if (Array.isArray(formData.profileRoles) && formData.profileRoles.length > 0) updates.profileRoles = []
    }
    if (isServicesCategory && formData.maxParticipants !== '1') updates.maxParticipants = '1'
    if (isStudioLieuCategory || isVenteCategory || isEmploiRequest || isCastingFigurantRequest || isProjetsEquipeRequest) {
      if (formData.maxParticipants !== '1') updates.maxParticipants = '1'
    }
    if (isProjetsEquipeRequest) {
      if (formData.profileLevel) updates.profileLevel = ''
      if (Array.isArray(formData.profileRoles) && formData.profileRoles.length > 0) updates.profileRoles = []
      if (formData.externalLink) updates.externalLink = ''
      if (formData.documentUrl) updates.documentUrl = ''
      if (formData.documentName) updates.documentName = ''
    }
    if (isStudioLieuCategory || isVenteCategory || isCreationContenuCategory || isPosteServiceCategory || isServicesCategory || isSuiviCategory || (isCastingCategory && !isCastingFigurantRequest)) {
      if (formData.documentUrl) updates.documentUrl = ''
      if (formData.documentName) updates.documentName = ''
    }
    if (isStudioLieuCategory && formData.urgent) updates.urgent = false
    if (isVenteCategory || isCreationContenuCategory || isPosteServiceCategory || isSuiviCategory || (isCastingCategory && !isCastingFigurantRequest)) {
      if (formData.externalLink) updates.externalLink = ''
    }
    if (isVenteCategory || isEmploiRequest) {
      if (formData.taggedPostId) updates.taggedPostId = ''
    }
    if (Object.keys(updates).length > 0) {
      onUpdateFormData(updates)
    }
  }, [
    isStudioLieuCategory,
    isVenteCategory,
    isCreationContenuCategory,
    isCastingCategory,
    isEmploiCategory,
    isPosteServiceCategory,
    isProjetsEquipeCategory,
    isServicesCategory,
    isEvenementsCategory,
    isSuiviCategory,
    isEmploiRequest,
    isCastingFigurantRequest,
    isProjetsEquipeRequest,
    mediaPickerType,
    formData.video,
    formData.profileLevel,
    formData.profileRoles,
    formData.maxParticipants,
    formData.documentUrl,
    formData.documentName,
    formData.externalLink,
    formData.taggedPostId,
    formData.urgent,
    onUpdateFormData
  ])

  // Hooks de consentement
  const locationConsent = useConsent('location')
  const mediaConsent = useConsent('media')

  // Gérer le refus pour la localisation
  const handleRejectLocation = () => {
    locationConsent.handleReject()
    // L'action est simplement annulée, l'utilisateur reste sur la page
  }

  // Gérer le refus pour les médias
  const handleRejectMedia = () => {
    mediaConsent.handleReject()
    // L'action est simplement annulée, l'utilisateur reste sur la page
  }

  useEffect(() => {
    if (!user) {
      setUserPosts([])
      return
    }

    let isMounted = true
    const fetchUserPosts = async () => {
      setLoadingUserPosts(true)
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, created_at, images')
          .eq('user_id', user.id)
          .in('status', ['active', 'pending'] as any)
          .order('created_at', { ascending: false })
          .returns<Array<{ id: string; title: string | null; created_at: string; images: string[] | null }>>()

        if (error) {
          console.error('Error fetching user posts:', error)
          if (isMounted) setUserPosts([])
          return
        }

        const filtered = (data || [])
          .filter((post: { id: string }) => post.id !== currentPostId)
          .map((post: { id: string; title: string | null; images: string[] | null }) => ({
            id: post.id,
            title: post.title || 'Annonce sans titre',
            image: Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null
          }))

        if (isMounted) setUserPosts(filtered)
      } catch (fetchError) {
        console.error('Error fetching user posts:', fetchError)
        if (isMounted) setUserPosts([])
      } finally {
        if (isMounted) setLoadingUserPosts(false)
      }
    }

    fetchUserPosts()

    return () => {
      isMounted = false
    }
  }, [user, currentPostId])

  const taggedPostName = useMemo(() => {
    const selected = userPosts.find((post) => post.id === formData.taggedPostId)
    return selected?.title || 'Choisir une annonce'
  }, [userPosts, formData.taggedPostId])

  const getDocumentNameFromUrl = (url?: string | null) => {
    if (!url) return ''
    const [baseUrl, hash] = url.split('#')
    if (hash) {
      const params = new URLSearchParams(hash)
      const name = params.get('name')
      if (name) return name
    }
    const cleanUrl = baseUrl.split('?')[0]
    const fileName = cleanUrl.split('/').pop()
    return fileName ? decodeURIComponent(fileName) : ''
  }

  const buildDocumentUrlWithName = (url: string, name?: string) => {
    const baseUrl = url.split('#')[0]
    const trimmedName = name?.trim()
    if (!trimmedName) return baseUrl
    const params = new URLSearchParams({ name: trimmedName })
    return `${baseUrl}#${params.toString()}`
  }

  const getVideoDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(video.duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Impossible de lire la durée de la vidéo.'))
      }
      video.src = url
    })

  const performMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (!user) {
      alert('Vous devez être connecté pour télécharger des médias')
      return
    }

    setUploading(true)
    const uploadedImages: string[] = []
    let uploadedVideo: string | null = null
    let remainingImageSlots = 7 - formData.images.length
    const selectedFiles = Array.from(files)

    for (const file of selectedFiles) {
      try {
        if (file.size > 52428800) {
          alert(`Le fichier ${file.name} est trop volumineux (max 50MB)`)
          continue
        }

        if (file.type.startsWith('video/')) {
          if (formData.video || uploadedVideo) {
            alert('Vous ne pouvez ajouter qu\'une seule vidéo.')
            continue
          }

          const duration = await getVideoDuration(file)
          if (duration > 10) {
            alert('La vidéo ne doit pas dépasser 10 secondes')
            continue
          }

          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading video:', uploadError)
            if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
              alert('Le bucket de stockage n\'existe pas. Veuillez exécuter le script SQL de création du bucket.')
            } else {
              alert(`Erreur lors du téléchargement de ${file.name}: ${uploadError.message}`)
            }
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName)

          if (publicUrl) {
            uploadedVideo = publicUrl
          } else {
            console.error('Impossible de récupérer l\'URL publique de la vidéo')
            alert(`Erreur lors de la récupération de l'URL de ${file.name}`)
          }
        } else {
          if (remainingImageSlots <= 0) continue

          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
          if (!allowedTypes.includes(file.type)) {
            alert(`Le type de fichier ${file.name} n'est pas supporté. Utilisez JPEG, PNG, GIF ou WebP.`)
            continue
          }

          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = fileName

          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
              alert('Le bucket de stockage n\'existe pas. Veuillez exécuter le script SQL de création du bucket.')
            } else {
              alert(`Erreur lors du téléchargement de ${file.name}: ${uploadError.message}`)
            }
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(filePath)

          if (publicUrl) {
            uploadedImages.push(publicUrl)
            remainingImageSlots -= 1
          } else {
            console.error('Impossible de récupérer l\'URL publique de l\'image')
            alert(`Erreur lors de la récupération de l'URL de ${file.name}`)
          }
        }
      } catch (error) {
        console.error('Error uploading media:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Erreur lors du téléchargement de ${file.name}: ${errorMessage}`)
      }
    }

    if (uploadedImages.length > 0 || uploadedVideo) {
      onUpdateFormData({
        images: uploadedImages.length > 0 ? [...formData.images, ...uploadedImages] : formData.images,
        video: uploadedVideo ?? formData.video
      })
    }
    setUploading(false)
    if (e.target) {
      e.target.value = ''
    }
  }

  // Envelopper handleMediaUpload avec le consentement
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    mediaConsent.requireConsent(() => {
      performMediaUpload(e)
    })
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    onUpdateFormData({ images: newImages })
  }

  const removeVideo = () => {
    onUpdateFormData({ video: null })
  }

  const performDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) {
      alert('Vous devez être connecté pour télécharger un document')
      return
    }

    if (file.size > 52428800) {
      alert(`Le fichier ${file.name} est trop volumineux (max 50MB)`)
      return
    }

    const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdfType) {
      alert(`Le type de fichier ${file.name} n'est pas supporté. Utilisez un PDF.`)
      return
    }

    setUploadingDocument(true)

    try {
      const fileExt = file.name.split('.').pop() || 'pdf'
      const fileName = `${user.id}/documents/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading document:', uploadError)
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          alert('Le bucket de stockage n\'existe pas. Veuillez exécuter le script SQL de création du bucket.')
        } else {
          alert(`Erreur lors du téléchargement de ${file.name}: ${uploadError.message}`)
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      if (publicUrl) {
        const initialName = file.name
        onUpdateFormData({ documentUrl: publicUrl, documentName: initialName })
      } else {
        console.error('Impossible de récupérer l\'URL publique du document')
        alert(`Erreur lors de la récupération de l'URL de ${file.name}`)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`Erreur lors du téléchargement de ${file.name}: ${errorMessage}`)
    } finally {
      setUploadingDocument(false)
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    mediaConsent.requireConsent(() => {
      performDocumentUpload(e)
    })
  }

  const removeDocument = () => {
    onUpdateFormData({ documentUrl: '', documentName: '' })
  }

  const handleDocumentNameChange = (value: string) => {
    if (!formData.documentUrl) {
      onUpdateFormData({ documentName: value })
      return
    }
    onUpdateFormData({
      documentName: value,
      documentUrl: buildDocumentUrlWithName(formData.documentUrl, value)
    })
  }

  const handleLocationSelect = (location: {
    address: string
    lat: number
    lng: number
    city?: string
  }) => {
    locationConsent.requireConsent(() => {
      onUpdateFormData({
        location: location.city || location.address.split(',')[0].trim(),
        location_address: location.address,
        location_lat: location.lat,
        location_lng: location.lng,
        location_city: location.city || ''
      })
    })
  }

  return (
    <div className="step5-location-media">
      <h2 className="step-title">Localisation et médias</h2>

      <div className="form-group">
        <label className="form-label">Lieu *</label>
        <LocationAutocomplete
          value={formData.location_address || formData.location || ''}
          onChange={(value) => {
            // Si l'utilisateur tape manuellement, on met à jour juste location
            if (!formData.location_address || value !== formData.location_address) {
              onUpdateFormData({ location: value })
            }
          }}
          onLocationSelect={handleLocationSelect}
          placeholder="Rechercher une adresse (ex: Paris, France)"
          className="step5-location-autocomplete"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Média *</label>
        {!isPhotoOnlyMediaCategory && <p className="form-helper-text">1 vidéo maximum par publication</p>}
        {!isPhotoOnlyMediaCategory && (
        <div className="media-type-toggle" role="tablist" aria-label="Type de média">
          <button
            type="button"
            role="tab"
            aria-selected={mediaPickerType === 'photo'}
            className={`media-type-toggle-btn ${mediaPickerType === 'photo' ? 'active' : ''}`}
            onClick={() => setMediaPickerType('photo')}
          >
            Photos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mediaPickerType === 'video'}
            className={`media-type-toggle-btn ${mediaPickerType === 'video' ? 'active' : ''}`}
            onClick={() => setMediaPickerType('video')}
            disabled={!!formData.video}
          >
            Vidéo
          </button>
        </div>
        )}
        <div className="images-grid">
          {formData.images.map((url, index) => (
            <div key={index} className="image-preview">
              <img src={url} alt={`Preview ${index + 1}`} />
              <button 
                className="remove-image-button"
                onClick={() => removeImage(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {!isPhotoOnlyMediaCategory && formData.video && (
            <div className="image-preview">
              <video src={formData.video} controls playsInline />
              <button
                className="remove-image-button"
                onClick={removeVideo}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {formData.images.length < 7 && (
            <label className="upload-area" style={{ opacity: uploading ? 0.6 : 1 }}>
              {uploading ? (
                <>
                  <Loader size={40} className="upload-spinner" />
                  <span className="upload-text">Téléchargement...</span>
                </>
              ) : (
                <>
                  <Upload size={40} />
                  <span className="upload-text">
                    {mediaPickerType === 'photo' ? 'Ajouter des photos' : 'Ajouter une vidéo'}
                  </span>
                </>
              )}
              <input
                type="file"
                accept={isPhotoOnlyMediaCategory ? 'image/*' : (mediaPickerType === 'photo' ? 'image/*' : 'video/*')}
                multiple={isPhotoOnlyMediaCategory ? true : mediaPickerType === 'photo'}
                onChange={handleMediaUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>

      {!isVenteCategory && !isServicesCategory && !isEmploiRequest && !isCastingFigurantRequest && !isProjetsEquipeRequest && (
        <div className="form-group">
          <label className="form-label">Nombre maximum de participants</label>
          <input
            type="number"
            className="form-input"
            placeholder="1"
            value={formData.maxParticipants}
            onChange={(e) => onUpdateFormData({ maxParticipants: e.target.value })}
            min="1"
          />
        </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isCreationContenuCategory && !isCastingCategory && !isPosteServiceCategory && !isServicesCategory && !isEvenementsCategory && !isSuiviCategory && !isEmploiRequest && !isProjetsEquipeRequest && (
      <div className="form-group dropdown-field">
        <label className="form-label">Niveau recherché (optionnel)</label>
        <button
          type="button"
          className={`dropdown-trigger ${isProfileLevelOpen ? 'open' : ''}`}
          onClick={() => setIsProfileLevelOpen((prev) => !prev)}
        >
          <span>{formData.profileLevel || 'Choisir un niveau'}</span>
          <span className="dropdown-caret" aria-hidden="true" />
        </button>
        {isProfileLevelOpen && (
          <>
            <div
              className="publish-dropdown-backdrop"
              onClick={() => setIsProfileLevelOpen(false)}
            />
            <div className="publish-dropdown-panel profile-dropdown-panel">
              <div className="publish-dropdown-title">Choisissez un niveau</div>
              <div className="profile-dropdown-list publish-list">
                {profileLevelOptions.map((level) => {
                  const isSelected = formData.profileLevel === level
                  return (
                    <button
                      key={level}
                      type="button"
                      className={`profile-dropdown-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onUpdateFormData({ profileLevel: formData.profileLevel === level ? '' : level })
                        setIsProfileLevelOpen(false)
                      }}
                    >
                      <span className="profile-option-text">{level}</span>
                      {isSelected && (
                        <span
                          className="profile-option-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateFormData({ profileLevel: '' })
                          }}
                          role="button"
                          aria-label="Supprimer"
                        >
                          <X size={12} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isCreationContenuCategory && !isCastingCategory && !isEmploiCategory && !isPosteServiceCategory && !isServicesCategory && !isEvenementsCategory && !isSuiviCategory && maxParticipantsNumber > 1 && (
        <div className="form-group dropdown-field">
          <label className="form-label">Rôle recherché (optionnel)</label>
          <button
            type="button"
            className={`dropdown-trigger ${isProfileRoleOpen ? 'open' : ''}`}
            onClick={() => setIsProfileRoleOpen((prev) => !prev)}
          >
            <span>
              {formData.profileRoles && formData.profileRoles.length > 0
                ? formData.profileRoles.join(', ')
                : 'Choisir un rôle'}
            </span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {isProfileRoleOpen && (
            <>
              <div
                className="publish-dropdown-backdrop"
                onClick={() => setIsProfileRoleOpen(false)}
              />
              <div className="publish-dropdown-panel profile-dropdown-panel">
                <div className="publish-dropdown-title">Choisissez un ou plusieurs rôles</div>
                <div className="profile-dropdown-list publish-list">
                  {profileRoleOptions.map((role) => {
                    const roles = formData.profileRoles || []
                    const isActive = roles.includes(role)
                    return (
                      <button
                        key={role}
                        type="button"
                        className={`profile-dropdown-option ${isActive ? 'selected' : ''}`}
                        onClick={() => {
                          const nextRoles = isActive
                            ? roles.filter((item) => item !== role)
                            : [...roles, role]
                          onUpdateFormData({ profileRoles: nextRoles })
                        }}
                      >
                        <span className="profile-option-text">{role}</span>
                        {isActive && (
                          <span
                            className="profile-option-remove"
                            onClick={(e) => {
                              e.stopPropagation()
                              const nextRoles = roles.filter((item) => item !== role)
                              onUpdateFormData({ profileRoles: nextRoles })
                            }}
                            role="button"
                            aria-label="Supprimer"
                          >
                            <X size={12} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isEmploiRequest && !isProjetsEquipeRequest && (
      <div className="form-group dropdown-field">
        <label className="form-label">Taguer une annonce (optionnel)</label>
        <p className="form-helper-text">
          Choisissez une annonce en rapport avec votre annonce pour la mettre en avant.
        </p>
        {loadingUserPosts ? (
          <div className="form-helper-text">Chargement des annonces...</div>
        ) : userPosts.length === 0 ? (
          <div className="form-helper-text">Aucune annonce publiée pour le moment.</div>
        ) : (
          <>
            <button
              type="button"
              className={`dropdown-trigger ${isTaggedPostOpen ? 'open' : ''}`}
              onClick={() => setIsTaggedPostOpen((prev) => !prev)}
            >
              <span>{taggedPostName}</span>
              <span className="dropdown-caret" aria-hidden="true" />
            </button>
            {isTaggedPostOpen && (
              <>
                <div
                  className="publish-dropdown-backdrop"
                  onClick={() => setIsTaggedPostOpen(false)}
                />
                <div className="publish-dropdown-panel tagged-post-panel">
                  <div className="publish-dropdown-title">Choisissez une annonce à taguer</div>
                  <div className="tagged-post-list publish-list">
                    {userPosts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        className={`tagged-post-option ${formData.taggedPostId === post.id ? 'selected' : ''}`}
                        onClick={() => {
                          onUpdateFormData({ taggedPostId: post.id })
                          setIsTaggedPostOpen(false)
                        }}
                      >
                        <div className="tagged-post-thumb">
                          {post.image ? (
                            <img src={post.image} alt={post.title} />
                          ) : (
                            <div className="tagged-post-thumb-placeholder" />
                          )}
                        </div>
                        <span className="tagged-post-title">{post.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isCreationContenuCategory && (!isCastingCategory || isCastingFigurantRequest) && !isPosteServiceCategory && !isServicesCategory && !isSuiviCategory && !isProjetsEquipeRequest && (
      <div className="form-group">
        <label className="form-label">Lien (optionnel)</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://exemple.com"
          value={formData.externalLink || ''}
          onChange={(e) => onUpdateFormData({ externalLink: e.target.value })}
        />
      </div>
      )}

      {!isStudioLieuCategory && !isVenteCategory && !isCreationContenuCategory && (!isCastingCategory || isCastingFigurantRequest) && !isPosteServiceCategory && !isServicesCategory && !isSuiviCategory && !isProjetsEquipeRequest && (
      <div className="form-group">
        <label className="form-label">Document PDF (optionnel)</label>
        {formData.documentUrl ? (
          <div className="document-upload-card">
            <a
              className="document-link"
              href={formData.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formData.documentName?.trim() || getDocumentNameFromUrl(formData.documentUrl) || 'Document PDF'}
            </a>
            <button className="document-remove-button" onClick={removeDocument}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="document-upload-area" style={{ opacity: uploadingDocument ? 0.6 : 1 }}>
            {uploadingDocument ? (
              <>
                <Loader size={24} className="upload-spinner" />
                <span className="upload-text">Téléchargement...</span>
              </>
            ) : (
              <>
                <Upload size={24} />
                <span className="upload-text">Ajouter un PDF</span>
              </>
            )}
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleDocumentUpload}
              disabled={uploadingDocument}
              style={{ display: 'none' }}
            />
          </label>
        )}
        {formData.documentUrl && (
          <div className="document-name-field">
            <label className="form-label">Nom du document</label>
            <input
              type="text"
              className="form-input"
              value={formData.documentName || getDocumentNameFromUrl(formData.documentUrl) || ''}
              onChange={(e) => handleDocumentNameChange(e.target.value)}
              placeholder="Ex: Conditions générales"
            />
          </div>
        )}
      </div>
      )}

      {!isStudioLieuCategory && (
      <div className="form-group urgent-block">
        <label className="form-checkbox-label">
          <input
            type="checkbox"
            checked={formData.urgent}
            onChange={(e) => onUpdateFormData({ urgent: e.target.checked })}
          />
          <span>Marquer comme urgent</span>
        </label>
      </div>
      )}

      {/* Modals de consentement */}
      <ConsentModal
        visible={locationConsent.showModal}
        title={locationConsent.messages.title}
        message={locationConsent.messages.message}
        onAccept={locationConsent.handleAccept}
        onReject={handleRejectLocation}
        onLearnMore={locationConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={locationConsent.askAgainNextTime}
        onAskAgainChange={locationConsent.setAskAgainNextTime}
      />

      <ConsentModal
        visible={mediaConsent.showModal}
        title={mediaConsent.messages.title}
        message={mediaConsent.messages.message}
        onAccept={mediaConsent.handleAccept}
        onReject={handleRejectMedia}
        onLearnMore={mediaConsent.dismissModal}
        learnMoreHref="/profile/legal/politique-confidentialite"
        askAgainChecked={mediaConsent.askAgainNextTime}
        onAskAgainChange={mediaConsent.setAskAgainNextTime}
      />
    </div>
  )
}
