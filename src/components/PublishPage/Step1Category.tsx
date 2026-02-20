import { publicationTypes } from '../../constants/publishData'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import './Step1Category.css'

interface Step1CategoryProps {
  onSelectCategory: (categoryId: string) => void
  listingType?: 'offer' | 'request' | ''
}

export const Step1Category = ({ onSelectCategory, listingType }: Step1CategoryProps) => {
  const { t } = useTranslation(['publish', 'categories'])
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const isMobile = useIsMobile()
  const hiddenWhenRequest = new Set(['vente', 'studio-lieu', 'evenements', 'suivi'])
  const visibleCategories = publicationTypes.filter((category) =>
    listingType === 'request' ? !hiddenWhenRequest.has(category.slug) : true
  )

  const toggleDescription = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation()
    setExpandedDescriptions((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const getPreviewText = (text: string, wordLimit: number) => {
    const words = text.trim().split(/\s+/)
    if (words.length <= wordLimit) return { preview: text, hasMore: false }
    return { preview: words.slice(0, wordLimit).join(' '), hasMore: true }
  }

  const getPreviewWithHalfWord = (text: string, baseWordLimit: number) => {
    const adjustedLimit = baseWordLimit + 2
    const { preview, hasMore } = getPreviewText(text, adjustedLimit)
    if (!hasMore) return { preview, hasMore }
    const words = text.trim().split(/\s+/)
    const nextWord = words[adjustedLimit] ?? ''
    if (!nextWord) return { preview, hasMore }
    const cutLength = Math.max(1, Math.floor(nextWord.length / 2))
    return { preview: `${preview} ${nextWord.slice(0, cutLength)}`, hasMore }
  }
  const getFirstSentence = (text: string) => {
    const match = text.match(/^.*?[.!?](\s|$)/)
    return match ? match[0].trim() : text
  }
  return (
    <div className="step1-category">
      <h2 className="step-question">{t('publish:step1Title')}</h2>
      <p className="step-instruction">{t('publish:step1Instruction')}</p>
      <div className="categories-list">
        {visibleCategories.map((category) => {
          const Icon = category.icon
          const categoryLabel = t(`categories:titles.${category.slug}`, { defaultValue: category.name })
          const categoryDescription = t(`categories:descriptions.${category.slug}`, {
            defaultValue: category.description
          })
          const isExpanded = isMobile || !!expandedDescriptions[category.id]
          const extraWordsMap: Record<string, number> = {
            'emploi': 2,
            'creation-contenu': 1,
            'studio-lieu': 1,
            'projets-equipe': 1
          }
          const extraWords = extraWordsMap[category.slug] ?? 0
          const { preview, hasMore } = getPreviewWithHalfWord(categoryDescription, 6 + extraWords)
          const mobilePreview = getFirstSentence(categoryDescription)
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
                <div className="category-description-row">
                  <span
                    className={`category-description ${isExpanded || !hasMore ? 'is-expanded' : 'is-collapsed'}`}
                  >
                    {isExpanded || !hasMore
                      ? categoryDescription
                      : isMobile
                        ? mobilePreview
                        : preview}
                    {!isMobile && hasMore && !isExpanded && (
                      <button
                        type="button"
                        className="category-more inline"
                        onClick={(e) => toggleDescription(e, category.id)}
                        aria-label="Afficher la description complète"
                      >
                        ...
                      </button>
                    )}
                    {!isMobile && hasMore && isExpanded && (
                      <button
                        type="button"
                        className="category-more inline"
                        onClick={(e) => toggleDescription(e, category.id)}
                        aria-label="Réduire la description"
                      >
                        Réduire
                      </button>
                    )}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="category-arrow" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
