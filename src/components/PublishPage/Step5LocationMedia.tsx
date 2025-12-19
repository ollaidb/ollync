import { useState } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { LocationAutocomplete } from '../Location/LocationAutocomplete'
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    onUpdateFormData({ images: newImages })
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
        <LocationAutocomplete
          value={formData.location_address || formData.location || ''}
          onChange={(value) => {
            // Si l'utilisateur tape manuellement, on met à jour juste location
            if (!formData.location_address || value !== formData.location_address) {
              onUpdateFormData({ location: value })
            }
          }}
          onLocationSelect={handleLocationSelect}
          placeholder="Lieu"
          className="step5-location-autocomplete"
        />
        <button
          className="location-button"
          onClick={onGetMyLocation}
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
    </div>
  )
}

