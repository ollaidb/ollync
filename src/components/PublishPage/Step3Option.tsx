import { PublicationType, Subcategory, type Platform } from '../../constants/publishData'

export interface ExamplePost {
  id: string
  title?: string
  description?: string
  images?: string[] | null
  user?: { username?: string | null; full_name?: string | null; avatar_url?: string | null } | null
}
import './Step3Option.css'

interface Step3OptionProps {
  selectedSubcategory: Subcategory | null
  selectedCategory: PublicationType | null
  onSelectOption: (option: { id: string; name: string; platforms?: Platform[] }) => void
  examplePosts: ExamplePost[]
  loadingPosts: boolean
}

export const Step3Option = ({ 
  selectedSubcategory, 
  selectedCategory,
  onSelectOption,
  examplePosts: _examplePosts,
  loadingPosts: _loadingPosts 
}: Step3OptionProps) => {
  if (!selectedSubcategory || !selectedCategory) return null

  const options = selectedSubcategory.options || []

  if (options.length === 0) return null

  return (
    <div className="step3-option">
      <h2 className="step-title">Choisissez une option</h2>
      <div className="options-list">
        {options.map((option) => (
          <button
            key={option.id}
            className="option-card"
            onClick={() => onSelectOption(option)}
            style={{ '--category-color': selectedCategory.color } as React.CSSProperties}
          >
            <span className="option-name">{option.name}</span>
            {option.platforms && option.platforms.length > 0 && (
              <span className="option-hint">Sélectionner une plateforme</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

