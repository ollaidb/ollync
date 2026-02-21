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
    'vlog': [],
    'sketchs': [],
    'trends': [],
    'live': [],
    'autre': []
  },
  'casting-role': {
    'figurant': [],
    'modele-photo': [],
    'modele-video': [],
    'voix-off': [],
    'invite-podcast': [],
    'invite-micro-trottoir': [],
    'youtube-video': [],
    'autre': []
  },
  'emploi': {
    'montage': [],
    'micro-trottoir': [],
    'live': [],
    'ecriture-contenu': [],
    'autre': []
  },
  'poste-service': {
    'prestation': [],
    'food': [],
    'lieux': [],
    'autre': []
  },
  'studio-lieu': {
    'studio-creation': [],
    'lieux-residentiels': [],
    'lieux-professionnels': []
  },
  'projets-equipe': {
    'projet-emission': [],
    'projet-newsletter': [],
    'projet-interview': [],
    'projet-youtube': [],
    'projet-podcast': [],
    'projet-magazine': [],
    'projet-blog': [],
    'projet-media': [],
    'autre': []
  },
  'services': {
    'coaching-contenu': [],
    'strategie-editoriale': [],
    'organisation': [],
    'agence': [],
    'setup-materiel': [],
    'visage-marque': [],
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
  'suivi': {
    'production-sur-place': [],
    'voyage-deplacement': [],
    'evenement-sortie': [],
    'autre': []
  },
  'vente': {
    'comptes': [],
    'noms-utilisateur': [],
    'concepts-niches': [],
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
