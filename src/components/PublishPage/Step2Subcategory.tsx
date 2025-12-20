import { PublicationType } from '../../constants/publishData'
import './Step2Subcategory.css'

interface Step2SubcategoryProps {
  selectedCategory: PublicationType | null
  onSelectSubcategory: (subcategoryId: string) => void
  examplePosts: any[]
  loadingPosts: boolean
}

export const Step2Subcategory = ({ 
  selectedCategory, 
  onSelectSubcategory,
  examplePosts,
  loadingPosts 
}: Step2SubcategoryProps) => {
  if (!selectedCategory) return null

  const Icon = selectedCategory.icon

  return (
    <div className="step2-subcategory">
      <h2 className="step-title">Choisissez une sous-catégorie</h2>
      <div className="subcategories-list">
        {selectedCategory.subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            className="subcategory-card"
            onClick={() => onSelectSubcategory(subcategory.id)}
            style={{ '--category-color': selectedCategory.color } as React.CSSProperties}
          >
            <div className="subcategory-icon-wrapper">
              <Icon size={24} />
            </div>
            <div className="subcategory-content">
              <span className="subcategory-name">{subcategory.name}</span>
            </div>
          </button>
        ))}
      </div>
      
      {examplePosts.length > 0 && (
        <div className="example-posts-section">
          <h3 className="example-posts-title">Exemples d'annonces</h3>
          {loadingPosts ? (
            <div className="loading-posts">Chargement...</div>
          ) : (
            <div className="example-posts-grid">
              {examplePosts.map((post) => (
                <div key={post.id} className="example-post-card">
                  {post.images && post.images.length > 0 && (
                    <img 
                      src={post.images[0]} 
                      alt={post.title}
                      className="example-post-image"
                    />
                  )}
                  <div className="example-post-content">
                    <h4 className="example-post-title">{post.title}</h4>
                    <p className="example-post-description">{post.description?.substring(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

