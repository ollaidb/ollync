// Utilitaire pour convertir la structure subSubCategories en structure publishData
import { publicationTypes, type PublicationType, type Subcategory } from '../constants/publishData'
import { getSubSubCategories, getSubSubSubCategories } from './subSubCategories'

/**
 * Récupère les sous-catégories (N2) pour une catégorie depuis la base de données
 * et les enrichit avec les niveaux 3 et 4 depuis subSubCategories
 */
export function getSubcategoriesForPublish(categorySlug: string): Subcategory[] {
  const category = publicationTypes.find(c => c.slug === categorySlug)
  if (!category) return []

  // Récupérer les sous-catégories de base (N2) pour la publication.
  // "tout" est un filtre de navigation, pas une vraie sous-catégorie de publication.
  const subcategories = category.subcategories.filter(sub => sub.id !== 'tout')

  // Enrichir avec les niveaux 3 et 4
  return subcategories.map(sub => {
    const subSubCats = getSubSubCategories(categorySlug, sub.slug)
    
    // Si cette sous-catégorie a des sous-sous-catégories (N3)
    if (subSubCats.length > 0) {
      const options = subSubCats.map(subSub => {
        // Vérifier si cette sous-sous-catégorie a un niveau 4
        const subSubSubCats = getSubSubSubCategories(categorySlug, sub.slug, subSub.slug)
        
        return {
          id: subSub.slug,
          name: subSub.name,
          slug: subSub.slug,
          // Si N4 existe, les convertir en "platforms" pour la compatibilité
          platforms: subSubSubCats.length > 0 
            ? subSubSubCats.map(subSubSub => ({
                id: subSubSub.slug,
                name: subSubSub.name
              }))
            : undefined
        }
      })

      return {
        ...sub,
        options
      }
    }

    return sub
  })
}

/**
 * Récupère toutes les catégories avec leurs sous-catégories enrichies
 */
export function getPublicationTypesWithSubSubCategories(): PublicationType[] {
  return publicationTypes.map(category => ({
    ...category,
    subcategories: getSubcategoriesForPublish(category.slug)
  }))
}
