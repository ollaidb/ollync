import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
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

// Fonction pour déterminer si le champ "Réseau social" doit être affiché
const shouldShowSocialNetwork = (
  categorySlug: string | null | undefined,
  subcategorySlug: string | null | undefined
): boolean => {
  if (!categorySlug || !subcategorySlug) return false

  // Catégories où le réseau social est pertinent
  const relevantCategories: Record<string, string[]> = {
    'creation-contenu': ['photo', 'video', 'vlog', 'sketchs', 'trends', 'evenements'],
    'casting-role': ['figurant', 'modele-photo', 'modele-video', 'invite-podcast'],
    'montage': ['montage', 'live'],
    'services': ['coaching-contenu', 'strategie-editoriale', 'aide-live-moderation'],
    'vente': ['comptes', 'pack-compte-contenu']
  }

  const relevantSubcategories = relevantCategories[categorySlug]
  return relevantSubcategories ? relevantSubcategories.includes(subcategorySlug) : false
}

export const Step4Description = ({ 
  formData, 
  onUpdateFormData, 
  onContinue,
  selectedCategory,
  selectedSubcategory
}: Step4DescriptionProps) => {
  const canContinue = formData.title.trim().length > 0 && formData.description.trim().length > 0
  
  const showSocialNetwork = shouldShowSocialNetwork(
    selectedCategory?.slug,
    selectedSubcategory?.slug
  )

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
          <label className="form-label">Réseau social concerné</label>
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
        <label className="form-label">Prix (€)</label>
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

      <div className="form-group">
        <label className="form-label">Type d'échange</label>
        <select
          className="form-select"
          value={formData.exchange_type}
          onChange={(e) => onUpdateFormData({ exchange_type: e.target.value })}
        >
          <option value="">Sélectionner...</option>
          <option value="benevole">Bénévole</option>
          <option value="prix">Prix</option>
          <option value="echange">Échange</option>
        </select>
      </div>

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

