// Structure des sous-sous-catégories (niveaux 3 et 4)
// Cette structure définit les sous-sous-catégories pour chaque sous-catégorie

export interface SubSubCategory {
  id: string
  name: string
  slug: string
  subSubSubCategories?: SubSubSubCategory[] // Niveau 4
}

export interface SubSubSubCategory {
  id: string
  name: string
  slug: string
}

// Mapping des sous-sous-catégories par catégorie et sous-catégorie
// Structure: categorySlug -> subCategorySlug -> SubSubCategory[]
export const subSubCategoriesMap: Record<string, Record<string, SubSubCategory[]>> = {
  'creation-contenu': {
    'photo': [],
    'video': [],
    'live': [],
    'interview-emission': [],
    'podcast': [],
    'court-metrage': [],
    'magazine-blog': [],
    'media': [],
    'newsletter': [],
    'chaine-youtube': [],
    'autre': []
  },
  'casting-role': {
    'figurant': [],
    'modele-photo': [],
    'modele-video': [],
    'voix-off': [],
    'invite': [],
    'autre': []
  },
  'emploi': {
    'montage': [],
    'micro-trottoir': [],
    'live': [],
    'ecriture-contenu': [],
    'autre': []
  },
  'studio-lieu': {
    'lieu-loisirs': [],
    'lieu-bien-etre': [],
    'lieux-residentiels': [],
    'lieux-professionnels': [],
    'autre': []
  },
  'services': {
    'coaching-contenu': [],
    'agence': [],
    'animation-compte': [],
    'autre': []
  },
  'evenements': {
    'masterclass': [],
    'conference': [],
    'debat': [],
    'atelier': [],
    'autre': []
  },
  'vente': {
    'comptes': [],
    'gorille': [],
    'autre': []
  },
  // Compatibilité avec les anciens slugs (à supprimer progressivement)
  match: {
    'creation-contenu': []
  },
  role: {
    'figurant': [],
    'modele': [],
    'live': []
  }
}

/**
 * Récupère les sous-sous-catégories (N3) pour une catégorie et sous-catégorie données
 */
export function getSubSubCategories(
  categorySlug: string,
  subCategorySlug: string
): SubSubCategory[] {
  // Essayer d'abord avec le slug fourni
  let result = subSubCategoriesMap[categorySlug]?.[subCategorySlug] || []
  
  // Compatibilité avec les anciens slugs
  if (result.length === 0) {
    if (categorySlug === 'recrutement' || categorySlug === 'role') {
      result = subSubCategoriesMap['casting-role']?.[subCategorySlug] || []
      if (result.length === 0) {
        result = subSubCategoriesMap['role']?.[subCategorySlug] || []
      }
    } else if (categorySlug === 'match') {
      result = subSubCategoriesMap['creation-contenu']?.[subCategorySlug] || []
      if (result.length === 0) {
        result = subSubCategoriesMap['match']?.[subCategorySlug] || []
      }
    } else if (categorySlug === 'projet') {
      result = subSubCategoriesMap['projets-equipe']?.[subCategorySlug] || []
    } else if (categorySlug === 'service') {
      result = subSubCategoriesMap['services']?.[subCategorySlug] || []
    }
  }
  
  return result
}

/**
 * Vérifie si une sous-catégorie a des sous-sous-catégories (N3)
 */
export function hasSubSubCategories(
  categorySlug: string,
  subCategorySlug: string
): boolean {
  const subSubCats = getSubSubCategories(categorySlug, subCategorySlug)
  return subSubCats.length > 0
}

/**
 * Récupère les sous-sous-sous-catégories (N4) pour une sous-sous-catégorie (N3)
 */
export function getSubSubSubCategories(
  categorySlug: string,
  subCategorySlug: string,
  subSubCategorySlug: string
): SubSubSubCategory[] {
  const subSubCats = getSubSubCategories(categorySlug, subCategorySlug)
  const subSubCat = subSubCats.find(cat => cat.slug === subSubCategorySlug)
  return subSubCat?.subSubSubCategories || []
}

/**
 * Vérifie si une sous-sous-catégorie (N3) a des sous-sous-sous-catégories (N4)
 */
export function hasSubSubSubCategories(
  categorySlug: string,
  subCategorySlug: string,
  subSubCategorySlug: string
): boolean {
  const subSubSubCats = getSubSubSubCategories(categorySlug, subCategorySlug, subSubCategorySlug)
  return subSubSubCats.length > 0
}
