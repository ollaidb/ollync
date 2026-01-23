import { X, DollarSign, RefreshCw } from 'lucide-react'
import './ServiceDetailModal.css'

interface Service {
  name: string
  description: string
  payment_type: 'price' | 'exchange'
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

  return (
    <div className="service-detail-overlay" onClick={onClose}>
      <div className="service-detail-content" onClick={(e) => e.stopPropagation()}>
        <button className="service-detail-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="service-detail-header">
          <h2 className="service-detail-title">{service.name}</h2>
          
          <div className="service-detail-payment">
            {service.payment_type === 'price' && service.value && (
              <div className="service-detail-price-badge">
                <DollarSign size={20} />
                <span>{service.value}</span>
              </div>
            )}
            {service.payment_type === 'exchange' && (
              <div className="service-detail-exchange-badge">
                <RefreshCw size={20} />
                <span>Échange</span>
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

        {service.payment_type === 'exchange' && service.value && (
          <div className="service-detail-exchange-section">
            <h3 className="service-detail-exchange-label">Échange proposé</h3>
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
