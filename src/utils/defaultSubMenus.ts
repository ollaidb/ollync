// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible
// Doit correspondre à la structure définie dans Menu.tsx

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  match: [
    { name: 'Création de contenu', slug: 'creation-contenu' },
    { name: 'Plus One', slug: 'plus-one' },
    { name: 'Événements', slug: 'evenements' }
  ],
  recrutement: [
    { name: 'Modèles', slug: 'modele' },
    { name: 'Figurants', slug: 'figurant' },
    { name: 'Live', slug: 'live' },
    { name: 'Vlog', slug: 'vlog' },
    { name: 'Copywriting', slug: 'copywriting' },
    { name: 'Montage vidéo', slug: 'montage-video' }
  ],
  projet: [
    { name: 'Association / Collaboration', slug: 'association-collaboration' }
  ],
  service: [
    { name: 'Échange de service', slug: 'echange-service' },
    { name: 'Tâches', slug: 'taches' },
    { name: 'Formation', slug: 'formation' }
  ],
  vente: [
    { name: 'Échange', slug: 'echange' },
    { name: 'Vente de comptes', slug: 'vente-comptes' },
    { name: 'Don', slug: 'don' }
  ],
  mission: [
    { name: 'Livraison', slug: 'livraison' },
    { name: 'Vérification', slug: 'verification' },
    { name: 'Cuisine', slug: 'cuisine' }
  ],
  autre: [
    { name: 'Autre service', slug: 'autre-service' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}

