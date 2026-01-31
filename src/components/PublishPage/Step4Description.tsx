import { useEffect } from 'react'
import { shouldShowSocialNetwork, getPaymentOptionsForCategory, getPaymentOptionConfig } from '../../utils/publishHelpers'
import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
  contract_type?: string
  work_schedule?: string
  responsibilities?: string
  required_skills?: string
  benefits?: string
  exchange_service?: string
  revenue_share_percentage?: string
  co_creation_details?: string
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
  const isJobCategory = (selectedCategory?.slug ?? formData.category) === 'montage'
  const paymentOptions = getPaymentOptionsForCategory(selectedCategory?.slug ?? formData.category)
  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
  const requiresPrice = !!paymentConfig?.requiresPrice
  const requiresExchangeService = !!paymentConfig?.requiresExchangeService
  const requiresRevenueShare = !!paymentConfig?.requiresPercentage
  const showCoCreationDetails = formData.exchange_type === 'co-creation'
  const descriptionPlaceholder = isJobCategory
    ? 'Décris le poste, les missions, les compétences requises, le profil recherché et les avantages.'
    : 'Décrivez en détail votre annonce...'
  
  // Synchroniser le moyen de paiement avec la catégorie sélectionnée
  useEffect(() => {
    if (paymentOptions.length === 0) return
    const hasValidPayment = paymentOptions.some((option) => option.id === formData.exchange_type)
    const shouldAutoSelect = paymentOptions.length === 1 && !hasValidPayment
    const shouldFixInvalid = !!formData.exchange_type && !hasValidPayment

    if (shouldAutoSelect || shouldFixInvalid) {
      onUpdateFormData({
        exchange_type: paymentOptions[0].id,
        price: '',
        exchange_service: '',
        revenue_share_percentage: '',
        co_creation_details: ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOptions, formData.exchange_type])
  
  // Validation complète des champs obligatoires de cette étape
  const canContinue = 
    formData.title.trim().length > 0 && 
    formData.description.trim().length > 0 &&
    (!isJobCategory || (formData.contract_type && formData.contract_type.trim().length > 0)) &&
    formData.exchange_type.trim().length > 0 &&
    (!requiresPrice || (formData.price && parseFloat(formData.price) > 0)) &&
    (!requiresExchangeService || (formData.exchange_service && formData.exchange_service.trim().length > 0)) &&
    (!requiresRevenueShare || (
      formData.revenue_share_percentage && 
      !Number.isNaN(parseFloat(formData.revenue_share_percentage)) &&
      parseFloat(formData.revenue_share_percentage) > 0 &&
      parseFloat(formData.revenue_share_percentage) <= 100
    )) &&
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

      {isJobCategory && (
        <>
          <div className="form-group">
            <label className="form-label">Type de contrat *</label>
            <select
              className="form-select"
              value={formData.contract_type || ''}
              onChange={(e) => onUpdateFormData({ contract_type: e.target.value })}
            >
              <option value="">Sélectionner un type de contrat...</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
              <option value="freelance">Freelance</option>
              <option value="stage">Stage</option>
              <option value="alternance">Alternance</option>
              <option value="interim">Intérim</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </>
      )}

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

      {!isJobCategory && (
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            placeholder={descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={6}
          />
        </div>
      )}

      {!isJobCategory && (
        <div className="form-group">
          <label className="form-label">Moyen de paiement *</label>
          <select
            className="form-select"
            value={formData.exchange_type}
            onChange={(e) => {
              const newExchangeType = e.target.value
              onUpdateFormData({ 
                exchange_type: newExchangeType,
                price: newExchangeType === 'remuneration' ? formData.price : '',
                exchange_service: newExchangeType === 'echange' ? formData.exchange_service : '',
                revenue_share_percentage: newExchangeType === 'partage-revenus' ? formData.revenue_share_percentage : '',
                co_creation_details: newExchangeType === 'co-creation' ? formData.co_creation_details : ''
              })
            }}
            disabled={paymentOptions.length === 1}
          >
            {paymentOptions.length > 1 && <option value="">Sélectionner...</option>}
            {paymentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(isJobCategory || requiresPrice) && (
        <div className="form-group">
          <label className="form-label">{isJobCategory ? 'Salaire (€) *' : 'Prix (€) *'}</label>
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

      {isJobCategory && (
        <div className="form-group">
          <label className="form-label">Description du poste *</label>
          <textarea
            className="form-textarea"
            placeholder={descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={6}
          />
        </div>
      )}

      {isJobCategory && (
        <>
          <div className="form-group">
            <label className="form-label">Horaires / temps de travail</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: 35h/semaine, lundi-vendredi, 9h-17h"
              value={formData.work_schedule || ''}
              onChange={(e) => onUpdateFormData({ work_schedule: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Missions / responsabilités</label>
            <textarea
              className="form-textarea"
              placeholder="Décrivez les missions principales du poste."
              value={formData.responsibilities || ''}
              onChange={(e) => onUpdateFormData({ responsibilities: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Compétences requises</label>
            <textarea
              className="form-textarea"
              placeholder="Listez les compétences attendues (ex: montage, rédaction, outils...)."
              value={formData.required_skills || ''}
              onChange={(e) => onUpdateFormData({ required_skills: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avantages</label>
            <textarea
              className="form-textarea"
              placeholder="Ex: télétravail, horaires flexibles, tickets resto..."
              value={formData.benefits || ''}
              onChange={(e) => onUpdateFormData({ benefits: e.target.value })}
              rows={3}
            />
          </div>
        </>
      )}

      {requiresExchangeService && (
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

      {requiresRevenueShare && (
        <div className="form-group">
          <label className="form-label">Pourcentage de partage (%) *</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={formData.revenue_share_percentage || ''}
            onChange={(e) => onUpdateFormData({ revenue_share_percentage: e.target.value })}
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      )}

      {showCoCreationDetails && (
        <div className="form-group">
          <label className="form-label">Détails de co-création (optionnel)</label>
          <textarea
            className="form-textarea"
            placeholder="Ajoutez une précision si besoin..."
            value={formData.co_creation_details || ''}
            onChange={(e) => onUpdateFormData({ co_creation_details: e.target.value })}
            rows={3}
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

