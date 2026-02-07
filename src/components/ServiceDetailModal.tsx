import { X, DollarSign, RefreshCw } from 'lucide-react'
import { getPaymentOptionConfig } from '../utils/publishHelpers'
import './ServiceDetailModal.css'

interface Service {
  name: string
  description: string
  payment_type: string
  value: string
}

interface ServiceDetailModalProps {
  service: Service | null
  onClose: () => void
  canRequest?: boolean
  requestStatus?: 'pending' | 'accepted' | 'declined' | 'cancelled' | null
  onRequestClick?: () => void
  requestLoading?: boolean
}

const ServiceDetailModal = ({ 
  service, 
  onClose, 
  canRequest = false, 
  requestStatus = null,
  onRequestClick,
  requestLoading = false
}: ServiceDetailModalProps) => {
  if (!service) return null

  const paymentConfig = getPaymentOptionConfig(service.payment_type)
  const paymentLabel = paymentConfig?.name || 'Paiement'
  const requiresPrice = paymentConfig?.requiresPrice || service.payment_type === 'price'
  const requiresExchangeService = paymentConfig?.requiresExchangeService || service.payment_type === 'exchange'
  const requiresPercentage = !!paymentConfig?.requiresPercentage

  return (
    <div className="service-detail-overlay" onClick={onClose}>
      <div className="service-detail-content" onClick={(e) => e.stopPropagation()}>
        <button className="service-detail-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="service-detail-header">
          <h2 className="service-detail-title">{service.name}</h2>
          
          <div className="service-detail-payment">
            {requiresPrice && service.value && (
              <div className="service-detail-price-badge">
                <DollarSign size={20} />
                <span>{service.value}</span>
              </div>
            )}
            {requiresPercentage && service.value && (
              <div className="service-detail-price-badge">
                <DollarSign size={20} />
                <span>{service.value}</span>
              </div>
            )}
            {requiresExchangeService && (
              <div className="service-detail-exchange-badge">
                <RefreshCw size={20} />
                <span>{paymentLabel}</span>
              </div>
            )}
            {!requiresPrice && !requiresExchangeService && !requiresPercentage && (
              <div className="service-detail-payment-badge">
                <span>{paymentLabel}</span>
              </div>
            )}
          </div>
        </div>

        {service.description && (
          <div className="service-detail-description-section">
            <h3 className="service-detail-description-label">Description</h3>
            <p className="service-detail-description-text">{service.description}</p>
          </div>
        )}

        {requiresExchangeService && service.value && (
          <div className="service-detail-exchange-section">
            <h3 className="service-detail-exchange-label">{paymentLabel}</h3>
            <p className="service-detail-exchange-value">{service.value}</p>
          </div>
        )}

        {canRequest && (
          <div className="service-detail-actions">
            <button
              className={`service-detail-request-btn ${requestStatus === 'pending' ? 'service-detail-request-btn-sent' : requestStatus === 'accepted' ? 'service-detail-request-btn-accepted' : ''}`}
              onClick={onRequestClick}
              disabled={requestLoading || requestStatus === 'accepted'}
            >
              {requestStatus === 'pending' ? 'Demande envoyée' : requestStatus === 'accepted' ? 'Demande acceptée' : 'Faire une demande'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceDetailModal
