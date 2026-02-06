import { Check } from 'lucide-react'
import './CustomList.css'

export interface ListItem {
  id: string
  name: string
  description?: string
}

export interface CustomListProps {
  items: ListItem[]
  selectedId?: string
  onSelectItem: (id: string) => void
  className?: string
  showCheckbox?: boolean
  showDescription?: boolean
}

export const CustomList = ({
  items,
  selectedId,
  onSelectItem,
  className = '',
  showCheckbox = true,
  showDescription = true
}: CustomListProps) => {
  return (
    <div className={`custom-list ${!showCheckbox ? 'no-checkbox' : ''} ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`custom-list-item ${selectedId === item.id ? 'selected' : ''}`}
          onClick={() => onSelectItem(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectItem(item.id)
            }
          }}
        >
          {showCheckbox && (
            <div className="custom-list-item-checkbox">
              {selectedId === item.id && <Check size={16} />}
            </div>
          )}
          <div className="custom-list-item-content">
            <div className="custom-list-item-name">{item.name}</div>
            {showDescription && item.description && (
              <div className="custom-list-item-description">{item.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
