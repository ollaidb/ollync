import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription: string
  price: string
  exchange_type: string
  [key: string]: any
}

interface Step4DescriptionProps {
  formData: FormData
  onUpdateFormData: (updates: Partial<FormData>) => void
  onContinue: () => void
}

export const Step4Description = ({ formData, onUpdateFormData, onContinue }: Step4DescriptionProps) => {
  const canContinue = formData.title.trim().length > 0 && formData.description.trim().length > 0

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
        <label className="form-label">Description courte</label>
        <input
          type="text"
          className="form-input"
          placeholder="Une description courte (optionnel)"
          value={formData.shortDescription}
          onChange={(e) => onUpdateFormData({ shortDescription: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description complète *</label>
        <textarea
          className="form-textarea"
          placeholder="Décrivez en détail votre annonce..."
          value={formData.description}
          onChange={(e) => onUpdateFormData({ description: e.target.value })}
          rows={6}
        />
      </div>

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

