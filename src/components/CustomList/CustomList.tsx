import { useState } from 'react'
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleDescription = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getCollapsedPreview = (description: string) => {
    const words = description.trim().split(/\s+/)
    const preview = words.slice(0, 3).join(' ')
    const remainder = words.slice(3).join(' ')
    return { preview, remainder }
  }

  return (
    <div className={`custom-list ${!showCheckbox ? 'no-checkbox' : ''} ${className}`}>
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id)
        const collapsed = item.description ? getCollapsedPreview(item.description) : null
        return (
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
              {showDescription && item.description && collapsed && (
                <div
                  className={`custom-list-item-description ${isExpanded ? 'expanded' : 'collapsed'}`}
                >
                  {isExpanded ? (
                    <>
                      <span className="custom-list-item-description-text expanded">
                        {item.description}
                      </span>
                      <button
                        type="button"
                        className="custom-list-item-description-more"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleDescription(item.id)
                        }}
                      >
                        réduire
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="custom-list-item-description-text collapsed">
                        {collapsed.preview}
                      </span>
                      <button
                        type="button"
                        className="custom-list-item-description-more"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleDescription(item.id)
                        }}
                      >
                        lire plus
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
