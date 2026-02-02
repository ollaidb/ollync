import { publicationTypes } from '../../constants/publishData'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import './Step1Category.css'

interface Step1CategoryProps {
  onSelectCategory: (categoryId: string) => void
}

export const Step1Category = ({ onSelectCategory }: Step1CategoryProps) => {
  const { t } = useTranslation(['publish', 'categories'])
  return (
    <div className="step1-category">
      <h2 className="step-question">{t('publish:step1Title')}</h2>
      <p className="step-instruction">{t('publish:step1Instruction')}</p>
      <div className="categories-list">
        {publicationTypes.map((category) => {
          const Icon = category.icon
          const categoryLabel = t(`categories:titles.${category.slug}`, { defaultValue: category.name })
          const categoryDescription = t(`categories:descriptions.${category.slug}`, {
            defaultValue: category.description
          })
          return (
            <button
              key={category.id}
              className="category-card"
              onClick={() => onSelectCategory(category.id)}
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              <div className="category-icon-wrapper">
                <Icon size={20} />
              </div>
              <div className="category-content">
              <span className="category-name">{categoryLabel}</span>
                <span className="category-description">{categoryDescription}</span>
              </div>
              <ChevronRight size={18} className="category-arrow" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

