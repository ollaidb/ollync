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
  match: {
    'creation-contenu': [
      { 
        id: 'photo', 
        name: 'Photo', 
        slug: 'photo' 
      },
      { 
        id: 'video', 
        name: 'Vidéo', 
        slug: 'video',
        subSubSubCategories: [
          { id: 'trend', name: 'Trend', slug: 'trend' },
          { id: 'vlog', name: 'Vlog', slug: 'vlog' },
          { id: 'skits', name: 'Skits', slug: 'skits' }
        ]
      }
    ],
    'plus-one': [
      { id: 'cinema', name: 'Cinéma', slug: 'cinema' },
      { id: 'resto', name: 'Resto', slug: 'resto' },
      { 
        id: 'evenement', 
        name: 'Événement', 
        slug: 'evenement',
        subSubSubCategories: [
          { id: 'mariage', name: 'Mariage', slug: 'mariage' },
          { id: 'concert', name: 'Concert', slug: 'concert' }
        ]
      },
      { id: 'boite-de-nuit', name: 'Boîte de nuit', slug: 'boite-de-nuit' },
      { id: 'voyage', name: 'Voyage', slug: 'voyage' }
    ]
  },
  role: {
    'figurant': [
      { 
        id: 'video', 
        name: 'Vidéo', 
        slug: 'video',
        subSubSubCategories: [
          { id: 'tiktok', name: 'TikTok', slug: 'tiktok' },
          { id: 'youtube', name: 'YouTube', slug: 'youtube' },
          { id: 'documentaire', name: 'Documentaire', slug: 'documentaire' },
          { id: 'sondage', name: 'Sondage', slug: 'sondage' }
        ]
      }
    ],
    'modele': [
      { id: 'photo', name: 'Photo', slug: 'photo' },
      { 
        id: 'video', 
        name: 'Vidéo', 
        slug: 'video',
        subSubSubCategories: [
          { id: 'pub', name: 'Pub', slug: 'pub' },
          { id: 'clip', name: 'Clip', slug: 'clip' }
        ]
      }
    ],
    'live': [
      { id: 'tiktok', name: 'TikTok', slug: 'tiktok' },
      { id: 'instagram', name: 'Instagram', slug: 'instagram' },
      { id: 'facebook', name: 'Facebook', slug: 'facebook' }
    ],
    'micro-trottoir': []
  },
  // Compatibilité avec l'ancien slug
  recrutement: {
    'figurant': [
      { 
        id: 'video', 
        name: 'Vidéo', 
        slug: 'video',
        subSubSubCategories: [
          { id: 'tiktok', name: 'TikTok', slug: 'tiktok' },
          { id: 'youtube', name: 'YouTube', slug: 'youtube' },
          { id: 'documentaire', name: 'Documentaire', slug: 'documentaire' },
          { id: 'sondage', name: 'Sondage', slug: 'sondage' }
        ]
      }
    ],
    'modele': [
      { id: 'photo', name: 'Photo', slug: 'photo' },
      { 
        id: 'video', 
        name: 'Vidéo', 
        slug: 'video',
        subSubSubCategories: [
          { id: 'pub', name: 'Pub', slug: 'pub' },
          { id: 'clip', name: 'Clip', slug: 'clip' }
        ]
      }
    ],
    'live': [
      { id: 'tiktok', name: 'TikTok', slug: 'tiktok' },
      { id: 'instagram', name: 'Instagram', slug: 'instagram' },
      { id: 'facebook', name: 'Facebook', slug: 'facebook' }
    ],
    'micro-trottoir': [],
    'montage-video': [
      { id: 'long-format', name: 'Long format', slug: 'long-format' },
      { id: 'court-format', name: 'Court format', slug: 'court-format' }
    ]
  },
  service: {
    'prestation': [],
    'echange-de-services': []
  },
  projet: {
    'associer': [],
    'creer-equipe': []
  },
  mission: {
    'livraison': [
      { id: 'colis', name: 'Colis', slug: 'colis' },
      { id: 'nourriture', name: 'Nourriture', slug: 'nourriture' }
    ],
    'depot': [
      { id: 'colis', name: 'Colis', slug: 'colis' }
    ],
    'verification': []
  },
  vente: {
    'compte': [
      { id: 'tiktok', name: 'TikTok', slug: 'tiktok' },
      { id: 'instagram', name: 'Instagram', slug: 'instagram' },
      { id: 'twitter', name: 'Twitter', slug: 'twitter' },
      { id: 'pinterest', name: 'Pinterest', slug: 'pinterest' },
      { id: 'facebook', name: 'Facebook', slug: 'facebook' }
    ]
  },
  autre: {
    'assistance': [
      { id: 'impot', name: 'Impôt', slug: 'impot' },
      { id: 'devoir', name: 'Devoir', slug: 'devoir' },
      { id: 'demenagement', name: 'Déménagement', slug: 'demenagement' }
    ]
  }
}

// Mapping pour Communication (si c'est une catégorie séparée)
export const communicationSubSubCategories: Record<string, SubSubCategory[]> = {
  'langue': [],
  'debat': []
}

/**
 * Récupère les sous-sous-catégories (N3) pour une catégorie et sous-catégorie données
 */
export function getSubSubCategories(
  categorySlug: string,
  subCategorySlug: string
): SubSubCategory[] {
  // Gérer le cas spécial de Communication
  if (categorySlug === 'communication') {
    return communicationSubSubCategories[subCategorySlug] || []
  }
  
  // Essayer d'abord avec le slug fourni, puis avec 'recrutement' pour compatibilité
  let result = subSubCategoriesMap[categorySlug]?.[subCategorySlug] || []
  if (result.length === 0 && categorySlug === 'recrutement') {
    result = subSubCategoriesMap['role']?.[subCategorySlug] || []
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
