import { publicationTypes } from '../../constants/publishData'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import './Step1Category.css'

interface Step1CategoryProps {
  onSelectCategory: (categoryId: string) => void
  listingType?: 'offer' | 'request' | ''
}

export const Step1Category = ({ onSelectCategory, listingType }: Step1CategoryProps) => {
  const { t } = useTranslation(['publish', 'categories'])
  // Les libellés Offre/Demande sont swappés côté UI :
  // - listingType 'request' => affiché "Offre"
  // - listingType 'offer'   => affiché "Demande"
  //
  // Règle demandée :
  // - Vente, Lieu, Évènement : visibles en "Offre", masqués en "Demande"
  const hiddenWhenDisplayedDemande = new Set(['vente', 'studio-lieu', 'evenements'])
  const visibleCategories = publicationTypes.filter((category) =>
    listingType === 'offer' ? !hiddenWhenDisplayedDemande.has(category.slug) : true
  )
  const CATEGORY_DESCRIPTIONS_BY_TYPE: Record<
    string,
    { default?: string }
  > = {
    'creation-contenu': {
      default:
        'Photo, vidéo, live, podcast, média, court-métrage...'
    },
    'casting-role': {
      default:
        'Figurant, modèle photo, modèle vidéo, voix off, invité.'
    },
    emploi: {
      default:
        'Montage, micro-trottoir, community manager, live, écriture de contenu.'
    },
    'studio-lieu': {
      default: 'Lieu de loisirs, lieu de bien-être, lieux résidentiels, lieux professionnels.'
    },
    services: {
      default: 'Coaching contenu, développement business, branding, animation de compte.'
    },
    evenements: {
      default: 'Masterclass, conférence, débat, atelier.'
    },
    vente: {
      default: 'Comptes, matériel.'
    }
  }

  const getCategoryDescription = (slug: string, fallback: string) => {
    const custom = CATEGORY_DESCRIPTIONS_BY_TYPE[slug]
    if (!custom) return fallback
    if (custom.default) return custom.default
    return fallback
  }

  return (
    <div className="step1-category">
      <h2 className="step-question">{t('publish:step1Title')}</h2>
      <p className="step-instruction">{t('publish:step1Instruction')}</p>
      <div className="categories-list">
        {visibleCategories.map((category) => {
          const Icon = category.icon
          const categoryLabel = t(`categories:titles.${category.slug}`, { defaultValue: category.name })
          const fallbackDescription = t(`categories:descriptions.${category.slug}`, {
            defaultValue: category.description
          })
          const categoryDescription = getCategoryDescription(category.slug, fallbackDescription)
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
                    className="category-description is-expanded"
                  >
                    {categoryDescription}
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
