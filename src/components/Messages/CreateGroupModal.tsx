import { useState, useRef } from 'react'
import { X, Upload, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import './CreateGroupModal.css'

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  participants?: Array<{
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }>
}

const CreateGroupModal = ({ visible, onClose, onSuccess, participants = [] }: CreateGroupModalProps) => {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!visible) return null

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La photo ne doit pas dépasser 5 Mo')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image')
        return
      }
      setGroupPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleCreateGroup = async () => {
    if (!user) {
      setError('Vous devez être connecté')
      return
    }

    if (!groupName.trim()) {
      setError('Veuillez entrer un nom pour le groupe')
      return
    }

    if (participants.length === 0) {
      setError('Sélectionnez au moins un participant')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let photoUrl: string | null = null

      // Upload de la photo si fournie
      if (groupPhoto) {
        try {
          // Vérifier la taille du fichier
          if (groupPhoto.size > 5 * 1024 * 1024) {
            throw new Error('La photo ne doit pas dépasser 5 Mo')
          }

          const fileExt = groupPhoto.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${fileExt}`
          
          // Essayer d'abord avec le bucket group-photos
          let { error: uploadError } = await supabase.storage
            .from('group-photos')
            .upload(fileName, groupPhoto, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            // Si le bucket group-photos n'existe pas, utiliser le bucket posts comme fallback
            console.warn('Bucket group-photos non disponible, utilisation du bucket posts:', uploadError)
            const { error: fallbackError } = await supabase.storage
              .from('posts')
              .upload(fileName, groupPhoto, {
                cacheControl: '3600',
                upsert: false
              })

            if (fallbackError) {
              throw new Error(`Erreur lors de l'upload de la photo: ${fallbackError.message || 'Erreur inconnue'}`)
            }

            // Récupérer l'URL depuis le bucket posts
            const { data: fallbackData } = supabase.storage
              .from('posts')
              .getPublicUrl(fileName)
            photoUrl = fallbackData.publicUrl
            console.log('Photo uploadée dans le bucket posts:', photoUrl)
          } else {
            // Récupérer l'URL depuis le bucket group-photos
            const { data } = supabase.storage
              .from('group-photos')
              .getPublicUrl(fileName)
            photoUrl = data.publicUrl
            console.log('Photo uploadée dans le bucket group-photos:', photoUrl)
          }

          if (!photoUrl) {
            throw new Error('Impossible de récupérer l\'URL de la photo')
          }
        } catch (uploadErr) {
          console.error('Erreur lors de l\'upload de la photo:', uploadErr)
          const errorMessage = uploadErr instanceof Error ? uploadErr.message : 'Erreur lors de l\'upload de la photo'
          setError(errorMessage)
          setLoading(false)
          return
        }
      }

      // Créer la conversation de groupe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conversation, error: convError } = await (supabase.from('conversations') as any)
        .insert({
          is_group: true,
          group_name: groupName.trim(),
          group_photo_url: photoUrl,
          group_creator_id: user.id
        })
        .select()
        .single()

      if (convError) {
        throw convError
      }

      // Ajouter le créateur comme participant
      if (conversation) {
        const { error: creatorParticipantError } = await (supabase.from('conversation_participants') as any)
          .insert({
            conversation_id: conversation.id,
            user_id: user.id,
            is_active: true
          })

        if (creatorParticipantError) {
          throw creatorParticipantError
        }

        const participantRows = participants
          .filter((participant) => participant.id !== user.id)
          .map((participant) => ({
            conversation_id: conversation.id,
            user_id: participant.id,
            is_active: true
          }))

        if (participantRows.length > 0) {
          const { error: participantsError } = await (supabase.from('conversation_participants') as any)
            .insert(participantRows)
          if (participantsError) {
            throw participantsError
          }
        }
      }

      // Réinitialiser le formulaire
      setGroupName('')
      setGroupPhoto(null)
      setPhotoPreview(null)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating group:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du groupe')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setGroupName('')
      setGroupPhoto(null)
      setPhotoPreview(null)
      setError(null)
      onClose()
    }
  }

  return (
    <div className="create-group-modal-overlay" onClick={handleClose}>
      <div className="create-group-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-group-modal-header">
          <h2>Créer un groupe</h2>
          <button className="create-group-modal-close" onClick={handleClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <div className="create-group-modal-body">
          {/* Photo du groupe */}
          <div className="create-group-photo-section">
            <div className="create-group-photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" />
              ) : (
                <div className="create-group-photo-placeholder">
                  <Upload size={32} />
                  <span>Photo du groupe</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="create-group-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />
          </div>

          {/* Nom du groupe */}
          <div className="create-group-field">
            <label htmlFor="group-name">Nom du groupe *</label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Entrez le nom du groupe"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className="create-group-participants">
            <span className="create-group-participants-label">Participants</span>
            {participants.length === 0 ? (
              <span className="create-group-participants-empty">Aucun participant sélectionné</span>
            ) : (
              <div className="create-group-participants-list">
                {participants.map((participant) => {
                  const name = participant.full_name || participant.username || 'Utilisateur'
                  return (
                    <div key={participant.id} className="create-group-participant">
                      <img
                        src={participant.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
                        alt={name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
                        }}
                      />
                      <span>{name}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="create-group-error">
              {error}
            </div>
          )}
        </div>

        <div className="create-group-modal-footer">
          <button
            className="create-group-btn-cancel"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="create-group-btn-create"
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim()}
          >
            {loading ? (
              <>
                <Loader className="spinner" size={16} />
                Création...
              </>
            ) : (
              'Créer le groupe'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGroupModal

