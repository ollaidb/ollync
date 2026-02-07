import { useEffect, useState } from 'react'
import { shouldShowSocialNetwork, getPaymentOptionsForCategory, getPaymentOptionConfig } from '../../utils/publishHelpers'
import { SOCIAL_NETWORKS_CONFIG } from '../../utils/socialNetworks'
import { CustomList } from '../CustomList/CustomList'
import './Step4Description.css'

interface FormData {
  title: string
  description: string
  shortDescription?: string
  socialNetwork?: string
  price: string
  exchange_type: string
  materialCondition?: string
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
  selectedSubSubCategory?: { slug: string } | null
}

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
  const isJobCategory = (selectedCategory?.slug ?? formData.category) === 'emploi'
  const paymentOptions = getPaymentOptionsForCategory(selectedCategory?.slug ?? formData.category)
  const paymentConfig = getPaymentOptionConfig(formData.exchange_type)
  const requiresPrice = !!paymentConfig?.requiresPrice
  const requiresExchangeService = !!paymentConfig?.requiresExchangeService
  const requiresRevenueShare = !!paymentConfig?.requiresPercentage
  const showCoCreationDetails = formData.exchange_type === 'co-creation'
  const [isSocialNetworkOpen, setIsSocialNetworkOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [isMaterialConditionOpen, setIsMaterialConditionOpen] = useState(false)

  const contractOptions = [
    { id: 'cdi', name: 'CDI' },
    { id: 'cdd', name: 'CDD' },
    { id: 'freelance', name: 'Freelance' },
    { id: 'stage', name: 'Stage' },
    { id: 'alternance', name: 'Alternance' },
    { id: 'interim', name: 'Intérim' },
    { id: 'autre', name: 'Autre' }
  ]

  const materialConditionOptions = [
    { id: 'neuf', name: 'État neuf' },
    { id: 'bon-etat', name: 'Bon état' },
    { id: 'etat-moyen', name: 'État moyen' }
  ]

  const selectedSocialNetworkName =
    SOCIAL_NETWORKS_CONFIG.find((network) => network.id === formData.socialNetwork)?.name ??
    'Choisir un réseau'
  const selectedPaymentName =
    paymentOptions.find((option) => option.id === formData.exchange_type)?.name ??
    'Choisir un moyen de paiement'
  const selectedContractName =
    contractOptions.find((option) => option.id === formData.contract_type)?.name ??
    'Choisir un type de contrat'
  const selectedMaterialConditionName =
    materialConditionOptions.find((option) => option.id === formData.materialCondition)?.name ??
    'Choisir un état du matériel'
  const isMaterialSale =
    (selectedCategory?.slug ?? formData.category) === 'vente' &&
    (selectedSubcategory?.slug ?? formData.subcategory) === 'gorille'
  const descriptionPlaceholder = isJobCategory
    ? 'Décris le poste, les missions, les compétences requises, le profil recherché et les avantages.'
    : 'Décrivez en détail votre annonce...'
  
  // Synchroniser le moyen de paiement avec la catégorie sélectionnée
  useEffect(() => {
    if (paymentOptions.length === 0) return
    const hasValidPayment = paymentOptions.some((option) => option.id === formData.exchange_type)
    const shouldFixInvalid = !!formData.exchange_type && !hasValidPayment

    if (shouldFixInvalid) {
      onUpdateFormData({
        exchange_type: '',
        price: '',
        exchange_service: '',
        revenue_share_percentage: '',
        co_creation_details: ''
      })
    }
  }, [paymentOptions])
  
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
    (!isMaterialSale || (formData.materialCondition && formData.materialCondition.trim().length > 0)) &&
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
          <div className="form-group dropdown-field">
            <label className="form-label">Type de contrat *</label>
            <button
              type="button"
              className={`dropdown-trigger ${isContractOpen ? 'open' : ''}`}
              onClick={() => setIsContractOpen((prev) => !prev)}
            >
              <span>{selectedContractName}</span>
              <span className="dropdown-caret" aria-hidden="true" />
            </button>
            {isContractOpen && (
              <>
                <div
                  className="publish-dropdown-backdrop"
                  onClick={() => setIsContractOpen(false)}
                />
                <div className="publish-dropdown-panel">
                  <div className="publish-dropdown-title">Choisissez un type de contrat</div>
                  <CustomList
                    items={contractOptions}
                    selectedId={formData.contract_type}
                    onSelectItem={(optionId) => {
                      onUpdateFormData({ contract_type: optionId })
                      setIsContractOpen(false)
                    }}
                    className="publish-list"
                    showCheckbox={false}
                    showDescription={false}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showSocialNetwork && (
        <div className="form-group dropdown-field">
          <label className="form-label">Réseau social concerné *</label>
          <button
            type="button"
            className={`dropdown-trigger ${isSocialNetworkOpen ? 'open' : ''}`}
            onClick={() => setIsSocialNetworkOpen((prev) => !prev)}
          >
            <span>{selectedSocialNetworkName}</span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {isSocialNetworkOpen && (
            <>
              <div
                className="publish-dropdown-backdrop"
                onClick={() => setIsSocialNetworkOpen(false)}
              />
              <div className="publish-dropdown-panel">
                <div className="publish-dropdown-title">Choisissez un réseau social</div>
                <CustomList
                  items={SOCIAL_NETWORKS_CONFIG}
                  selectedId={formData.socialNetwork}
                  onSelectItem={(networkId) => {
                    onUpdateFormData({ socialNetwork: networkId })
                    setIsSocialNetworkOpen(false)
                  }}
                  className="social-networks-list publish-list"
                  showCheckbox={false}
                />
              </div>
            </>
          )}
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

      {isMaterialSale && (
        <div className="form-group dropdown-field">
          <label className="form-label">État du matériel *</label>
          <button
            type="button"
            className={`dropdown-trigger ${isMaterialConditionOpen ? 'open' : ''}`}
            onClick={() => setIsMaterialConditionOpen((prev) => !prev)}
          >
            <span>{selectedMaterialConditionName}</span>
            <span className="dropdown-caret" aria-hidden="true" />
          </button>
          {isMaterialConditionOpen && (
            <>
              <div
                className="publish-dropdown-backdrop"
                onClick={() => setIsMaterialConditionOpen(false)}
              />
              <div className="publish-dropdown-panel">
                <div className="publish-dropdown-title">Choisissez un état du matériel</div>
                <CustomList
                  items={materialConditionOptions}
                  selectedId={formData.materialCondition}
                  onSelectItem={(optionId) => {
                    onUpdateFormData({ materialCondition: optionId })
                    setIsMaterialConditionOpen(false)
                  }}
                  className="publish-list"
                  showCheckbox={false}
                  showDescription={false}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Moyen de paiement - Visible pour toutes les catégories */}
      <div className="form-group dropdown-field">
        <label className="form-label">
          {isJobCategory ? 'Type de rémunération *' : 'Moyen de paiement *'}
        </label>
        <button
          type="button"
          className={`dropdown-trigger ${isPaymentOpen ? 'open' : ''}`}
          onClick={() => setIsPaymentOpen((prev) => !prev)}
        >
          <span>{selectedPaymentName}</span>
          <span className="dropdown-caret" aria-hidden="true" />
        </button>
        {isPaymentOpen && (
          <>
            <div
              className="publish-dropdown-backdrop"
              onClick={() => setIsPaymentOpen(false)}
            />
            <div className="publish-dropdown-panel">
              <div className="publish-dropdown-title">Choisissez un moyen de paiement</div>
              <CustomList
                items={paymentOptions}
                selectedId={formData.exchange_type}
                onSelectItem={(optionId) => {
                  onUpdateFormData({
                    exchange_type: optionId,
                    price: optionId === 'remuneration' ? formData.price : '',
                    exchange_service: optionId === 'echange' ? formData.exchange_service : '',
                    revenue_share_percentage: optionId === 'partage-revenus' ? formData.revenue_share_percentage : '',
                    co_creation_details: optionId === 'co-creation' ? formData.co_creation_details : ''
                  })
                  setIsPaymentOpen(false)
                }}
                className="payment-options-list publish-list"
                showCheckbox={false}
                showDescription={true}
              />
            </div>
          </>
        )}
      </div>

      {requiresPrice && (
        <div className="form-group">
          <label className="form-label">{isJobCategory ? 'Rémunération *' : 'Prix *'}</label>
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
