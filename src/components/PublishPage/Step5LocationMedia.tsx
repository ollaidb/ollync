import { useState } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConsent } from '../../hooks/useConsent'
import { GooglePlacesAutocomplete } from '../Location/GooglePlacesAutocomplete'
import ConsentModal from '../ConsentModal'
import './Step5LocationMedia.css'

interface FormData {
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
  maxParticipants: string
  duration_minutes: string
  visibility: string
  externalLink?: string
  documentUrl?: string
  documentName?: string
  [key: string]: any
}

interface Step5LocationMediaProps {
  formData: FormData
  onUpdateFormData: (updates: Partial<FormData>) => void
  onGetMyLocation: () => void
}

export const Step5LocationMedia = ({ formData, onUpdateFormData, onGetMyLocation }: Step5LocationMediaProps) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)

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

  // Gérer le clic sur le bouton de localisation GPS
  const handleGetLocationClick = () => {
    locationConsent.requireConsent(() => {
      onGetMyLocation()
    })
  }

  const performImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (!user) {
      alert('Vous devez être connecté pour télécharger des images')
      return
    }

    const newFiles = Array.from(files).slice(0, 7 - formData.images.length)
    if (newFiles.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (const file of newFiles) {
      try {
        if (file.size > 52428800) {
          alert(`Le fichier ${file.name} est trop volumineux (max 50MB)`)
          continue
        }

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
          uploadedUrls.push(publicUrl)
        } else {
          console.error('Impossible de récupérer l\'URL publique de l\'image')
          alert(`Erreur lors de la récupération de l'URL de ${file.name}`)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Erreur lors du téléchargement de ${file.name}: ${errorMessage}`)
      }
    }

    if (uploadedUrls.length > 0) {
      onUpdateFormData({ images: [...formData.images, ...uploadedUrls] })
    }
    setUploading(false)
  }

  // Envelopper handleImageUpload avec le consentement
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    mediaConsent.requireConsent(() => {
      performImageUpload(e)
    })
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    onUpdateFormData({ images: newImages })
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
    onUpdateFormData({
      location: location.city || location.address.split(',')[0].trim(),
      location_address: location.address,
      location_lat: location.lat,
      location_lng: location.lng,
      location_city: location.city || ''
    })
  }

  return (
    <div className="step5-location-media">
      <h2 className="step-title">Localisation et médias</h2>

      <div className="form-group">
        <label className="form-label">Lieu *</label>
        <GooglePlacesAutocomplete
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
        <button
          className="location-button"
          onClick={handleGetLocationClick}
        >
          Utiliser ma localisation GPS
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Photo *</label>
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
                  <span className="upload-text">Ajouter des photos</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>


      <div className="form-group">
        <label className="form-label">Date de besoin *</label>
        <input
          type="date"
          className="form-input"
          value={formData.deadline}
          onChange={(e) => onUpdateFormData({ deadline: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

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

      <div className="form-group">
        <label className="form-checkbox-label">
          <input
            type="checkbox"
            checked={formData.urgent}
            onChange={(e) => onUpdateFormData({ urgent: e.target.checked })}
          />
          <span>Marquer comme urgent</span>
        </label>
      </div>

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

      {/* Modals de consentement */}
      <ConsentModal
        visible={locationConsent.showModal}
        title={locationConsent.messages.title}
        message={locationConsent.messages.message}
        onAccept={locationConsent.handleAccept}
        onReject={handleRejectLocation}
      />

      <ConsentModal
        visible={mediaConsent.showModal}
        title={mediaConsent.messages.title}
        message={mediaConsent.messages.message}
        onAccept={mediaConsent.handleAccept}
        onReject={handleRejectMedia}
      />
    </div>
  )
}

