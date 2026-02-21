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
  // - Suivi : visible en "Demande"
  const hiddenWhenDisplayedDemande = new Set(['vente', 'studio-lieu', 'evenements', 'suivi'])
  const visibleCategories = publicationTypes.filter((category) =>
    listingType === 'offer' ? !hiddenWhenDisplayedDemande.has(category.slug) : true
  )
  // Les libellés Offre/Demande sont swappés côté UI.
  // On aligne donc les descriptions sur l'intention affichée et non la valeur technique stockée.
  const listingTypeForDisplayedIntent =
    listingType === 'offer' ? 'request' : listingType === 'request' ? 'offer' : ''

  const CATEGORY_DESCRIPTIONS_BY_TYPE: Record<
    string,
    { offer?: string; request?: string; default?: string }
  > = {
    'creation-contenu': {
      offer:
        'Collaboration en création de contenu: photo, vidéo, vlog... Collaborer à plusieurs.',
      request:
        'Recherche de collaboration en création de contenu: photo, vidéo, vlog... Trouver et collaborer à plusieurs.'
    },
    'casting-role': {
      offer:
        'Profil disponible pour un casting: figurant, modèle, voix off... Collaborer à plusieurs.',
      request:
        'Profils recherchés pour un casting: figurant, modèle, voix off... Trouver et collaborer à plusieurs.'
    },
    emploi: {
      offer:
        'Compétences disponibles pour des missions en création de contenu: montage, community management, écriture...',
      request:
        'Profils recherchés pour des missions en création de contenu: montage, community management, écriture...'
    },
    'studio-lieu': {
      offer: 'Lieux disponibles pour créer du contenu: studio, lieu résidentiel, lieu pro...'
    },
    'projets-equipe': {
      offer:
        'Rejoindre un projet existant: émission, podcast, interview... Collaborer à plusieurs.',
      request:
        'Chercher des profils pour construire un projet: émission, podcast, interview... Trouver et collaborer à plusieurs.'
    },
    services: {
      offer: 'Services disponibles: coaching contenu, stratégie éditoriale, organisation...',
      request: 'Services recherchés: coaching contenu, stratégie éditoriale, organisation...'
    },
    evenements: {
      offer: 'Événements proposés: masterclass, conférence, atelier...'
    },
    suivi: {
      default:
        'Accompagnement disponible: production sur place, déplacement, événement/sortie...'
    },
    vente: {
      default: 'À vendre: comptes, noms d’utilisateur, matériel...',
      request: 'Recherche d’achat: comptes, noms d’utilisateur, matériel...'
    },
    'poste-service': {
      offer: 'Échange service contre visibilité: prestation, food, lieux...',
      request: 'Échange service contre visibilité recherché: prestation, food, lieux...'
    }
  }

  const getCategoryDescription = (slug: string, fallback: string) => {
    const custom = CATEGORY_DESCRIPTIONS_BY_TYPE[slug]
    if (!custom) return fallback
    if (listingTypeForDisplayedIntent && custom[listingTypeForDisplayedIntent]) {
      return custom[listingTypeForDisplayedIntent] as string
    }
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
