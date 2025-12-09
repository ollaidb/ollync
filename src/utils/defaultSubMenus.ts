// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible
// Doit correspondre à la structure définie dans Menu.tsx

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  match: [
    { name: 'Création de contenu', slug: 'creation-contenu' },
    { name: 'Plus One', slug: 'plus-one' }
  ],
  role: [
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Modèle', slug: 'modele' },
    { name: 'Live', slug: 'live' },
    { name: 'Micro trottoir', slug: 'micro-trottoir' },
    { name: 'Montage Vidéo', slug: 'montage-video' }
  ],
  // Compatibilité avec l'ancien slug
  recrutement: [
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Modèle', slug: 'modele' },
    { name: 'Live', slug: 'live' },
    { name: 'Micro trottoir', slug: 'micro-trottoir' },
    { name: 'Montage Vidéo', slug: 'montage-video' }
  ],
  service: [
    { name: 'Prestation', slug: 'prestation' },
    { name: 'Échange de services', slug: 'echange-de-services' }
  ],
  projet: [
    { name: 'Associer', slug: 'associer' },
    { name: 'Créer une équipe', slug: 'creer-equipe' }
  ],
  mission: [
    { name: 'Livraison', slug: 'livraison' },
    { name: 'Dépôt', slug: 'depot' },
    { name: 'Vérification', slug: 'verification' }
  ],
  vente: [
    { name: 'Compte', slug: 'compte' }
  ],
  communication: [
    { name: 'Langue', slug: 'langue' },
    { name: 'Débat', slug: 'debat' }
  ],
  autre: [
    { name: 'Assistance', slug: 'assistance' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}

