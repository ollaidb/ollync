import { publicationTypes } from '../../constants/publishData'
import { ChevronRight } from 'lucide-react'
import './Step1Category.css'

interface Step1CategoryProps {
  onSelectCategory: (categoryId: string) => void
}

export const Step1Category = ({ onSelectCategory }: Step1CategoryProps) => {
  return (
    <div className="step1-category">
      <h2 className="step-question">Quel type d'annonce souhaitez-vous publier?</h2>
      <p className="step-instruction">Sélectionnez la catégorie qui correspond à votre besoin</p>
      <div className="categories-list">
        {publicationTypes.map((category) => {
          const Icon = category.icon
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
              <span className="category-name">{category.name}</span>
                <span className="category-description">{category.description}</span>
              </div>
              <ChevronRight size={18} className="category-arrow" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

