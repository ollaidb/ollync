import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { createCroppedImage } from '../../utils/createCroppedImage'
import './AvatarCropModal.css'

export interface AvatarCropModalProps {
  visible: boolean
  imageSrc: string
  onConfirm: (croppedBlob: Blob) => void
  onCancel: () => void
}

const AvatarCropModal = ({ visible, imageSrc, onConfirm, onCancel }: AvatarCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const blob = await createCroppedImage(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } catch (err) {
      console.error('Erreur recadrage avatar:', err)
      onCancel()
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, onConfirm, onCancel])

  if (!visible) return null

  return (
    <div
      className="avatar-crop-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <div className="avatar-crop-modal-content">
        <h3 id="avatar-crop-title" className="avatar-crop-modal-title">
          Cadrer la photo
        </h3>
        <div className="avatar-crop-modal-cropper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropAreaChange={onCropAreaChange}
          />
        </div>
        <div className="avatar-crop-modal-zoom">
          <span className="avatar-crop-zoom-label">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="avatar-crop-zoom-slider"
          />
        </div>
        <div className="avatar-crop-modal-actions">
          <button
            type="button"
            className="avatar-crop-modal-button avatar-crop-modal-button-cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Annuler
          </button>
          <button
            type="button"
            className="avatar-crop-modal-button avatar-crop-modal-button-confirm"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? 'En cours…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarCropModal
