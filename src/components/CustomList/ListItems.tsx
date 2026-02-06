/**
 * Composant réutilisable pour afficher des listes personnalisées
 * Remplace toutes les listes HTML natives <ul>, <ol>, <li>
 */

export interface ListItemContent {
  text: string | React.ReactNode
  description?: string
}

export interface BulletListProps {
  items: (string | ListItemContent)[]
  className?: string
}

export interface NumberedListProps {
  items: (string | ListItemContent)[]
  className?: string
}

export const BulletList = ({ items, className = '' }: BulletListProps) => {
  return (
    <div className={`custom-bullet-list ${className}`}>
      {items.map((item, index) => {
        const content = typeof item === 'string' ? item : item.text
        const description = typeof item === 'string' ? null : item.description
        
        return (
          <div key={index} className="custom-bullet-item">
            <span className="custom-bullet-point">•</span>
            <div className="custom-bullet-content">
              <div className="custom-bullet-text">{content}</div>
              {description && (
                <div className="custom-bullet-description">{description}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const NumberedList = ({ items, className = '' }: NumberedListProps) => {
  return (
    <div className={`custom-numbered-list ${className}`}>
      {items.map((item, index) => {
        const content = typeof item === 'string' ? item : item.text
        const description = typeof item === 'string' ? null : item.description
        
        return (
          <div key={index} className="custom-numbered-item">
            <span className="custom-numbered-point">{index + 1}</span>
            <div className="custom-numbered-content">
              <div className="custom-numbered-text">{content}</div>
              {description && (
                <div className="custom-numbered-description">{description}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
