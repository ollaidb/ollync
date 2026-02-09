import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusCircle, Search } from 'lucide-react'
import './Step0OfferDemand.css'

export type OfferDemandType = 'offer' | 'request'

interface Step0OfferDemandProps {
  value?: OfferDemandType | null
  onSelect: (value: OfferDemandType) => void
}

export const Step0OfferDemand = ({ value, onSelect }: Step0OfferDemandProps) => {
  const { t } = useTranslation(['publish'])

  const options: Array<{
    id: OfferDemandType
    title: string
    description: string
    Icon: typeof PlusCircle
    color: string
  }> = [
    {
      id: 'offer',
      title: t('publish:offerTitle'),
      description: t('publish:offerDescription'),
      Icon: PlusCircle,
      color: '#22c55e'
    },
    {
      id: 'request',
      title: t('publish:requestTitle'),
      description: t('publish:requestDescription'),
      Icon: Search,
      color: '#3b82f6'
    }
  ]

  return (
    <div className="offer-demand-step">
      <h2 className="step-question">{t('publish:step0Title')}</h2>
      <p className="step-instruction">{t('publish:step0Instruction')}</p>
      <div className="offer-demand-list">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`offer-demand-card ${value === option.id ? 'active' : ''}`}
            onClick={() => onSelect(option.id)}
            style={{ '--offer-demand-color': option.color } as CSSProperties}
          >
            <div className="offer-demand-icon">
              <option.Icon size={20} />
            </div>
            <div className="offer-demand-content">
              <span className="offer-demand-title">{option.title}</span>
              <span className="offer-demand-description">{option.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
