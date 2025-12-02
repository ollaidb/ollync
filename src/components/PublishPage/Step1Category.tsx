import { publicationTypes } from '../../constants/publishData'
import './Step1Category.css'

interface Step1CategoryProps {
  onSelectCategory: (categoryId: string) => void
}

export const Step1Category = ({ onSelectCategory }: Step1CategoryProps) => {
  return (
    <div className="step1-category">
      <h2 className="step-title">Choisissez une catégorie</h2>
      <div className="categories-grid">
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
                <Icon size={32} />
              </div>
              <span className="category-name">{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

