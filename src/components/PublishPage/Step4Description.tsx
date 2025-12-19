import { shouldShowSocialNetwork } from '../../utils/publishHelpers'
import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
  exchange_service?: string
  category?: string | null
  subcategory?: string | null
  subSubCategory?: string | null
  [key: string]: any
}

interface Step4DescriptionProps {
  formData: FormData
  onUpdateFormData: (updates: Partial<FormData>) => void
  onContinue: () => void
  selectedCategory?: { slug: string } | null
  selectedSubcategory?: { slug: string } | null
}

// Liste des réseaux sociaux disponibles
const SOCIAL_NETWORKS = [
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'discord', name: 'Discord' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'autre', name: 'Autre' }
]

export const Step4Description = ({ 
  formData, 
  onUpdateFormData, 
  onContinue,
  selectedCategory,
  selectedSubcategory
}: Step4DescriptionProps) => {
  const showSocialNetwork = shouldShowSocialNetwork(
    selectedCategory?.slug,
    selectedSubcategory?.slug
  )
  
  // Validation complète des champs obligatoires de cette étape
  const canContinue = 
    formData.title.trim().length > 0 && 
    formData.description.trim().length > 0 &&
    formData.exchange_type.trim().length > 0 &&
    (formData.exchange_type !== 'prix' || (formData.price && parseFloat(formData.price) > 0)) &&
    (formData.exchange_type !== 'echange' || (formData.exchange_service && formData.exchange_service.trim().length > 0)) &&
    (!showSocialNetwork || (formData.socialNetwork && formData.socialNetwork.trim().length > 0))

  return (
    <div className="step4-description">
      <h2 className="step-title">Décrivez votre annonce</h2>
      
      <div className="form-group">
        <label className="form-label">Titre *</label>
        <input
          type="text"
          className="form-input"
          placeholder="Ex: Développeur React recherché"
          value={formData.title}
          onChange={(e) => onUpdateFormData({ title: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea
          className="form-textarea"
          placeholder="Décrivez en détail votre annonce..."
          value={formData.description}
          onChange={(e) => onUpdateFormData({ description: e.target.value })}
          rows={6}
        />
      </div>

      {showSocialNetwork && (
        <div className="form-group">
          <label className="form-label">Réseau social concerné *</label>
          <select
            className="form-select"
            value={formData.socialNetwork || ''}
            onChange={(e) => onUpdateFormData({ socialNetwork: e.target.value })}
          >
            <option value="">Sélectionner un réseau social...</option>
            {SOCIAL_NETWORKS.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Moyen de paiement *</label>
        <select
          className="form-select"
          value={formData.exchange_type}
            onChange={(e) => {
            const newExchangeType = e.target.value
            onUpdateFormData({ 
              exchange_type: newExchangeType,
              // Réinitialiser le prix si on passe à "échange"
              price: newExchangeType === 'echange' ? '' : formData.price,
              // Réinitialiser le service échangé si on passe à "prix"
              exchange_service: newExchangeType === 'prix' ? '' : formData.exchange_service
            })
          }}
        >
          <option value="">Sélectionner...</option>
          <option value="prix">Prix</option>
          <option value="echange">Échange de service</option>
        </select>
      </div>

      {formData.exchange_type === 'prix' && (
        <div className="form-group">
          <label className="form-label">Prix (€) *</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={formData.price}
            onChange={(e) => onUpdateFormData({ price: e.target.value })}
            min="0"
            step="0.01"
          />
        </div>
      )}

      {formData.exchange_type === 'echange' && (
        <div className="form-group">
          <label className="form-label">Décrivez le service échangé *</label>
          <textarea
            className="form-textarea"
            placeholder="Ex: Je propose un échange de service de montage vidéo contre une séance photo..."
            value={formData.exchange_service || ''}
            onChange={(e) => onUpdateFormData({ exchange_service: e.target.value })}
            rows={4}
          />
        </div>
      )}

      <button
        className="continue-button"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continuer
      </button>
    </div>
  )
}

