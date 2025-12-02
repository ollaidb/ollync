// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible
// Doit correspondre à la structure définie dans Menu.tsx

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  match: [
    { name: 'Création de contenu', slug: 'creation-contenu' },
    { name: 'Plus One', slug: 'plus-one' },
    { name: 'Événement', slug: 'evenement' }
  ],
  recrutement: [
    { name: 'Modèle', slug: 'modele' },
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Live', slug: 'live' },
    { name: 'Vlog', slug: 'vlog' },
    { name: 'Copywriting', slug: 'copywriting' },
    { name: 'Montage vidéo', slug: 'montage-video' }
  ],
  projet: [
    { name: 'Chercher un associé', slug: 'chercher-associe' },
    { name: 'Chercher un collaborateur', slug: 'chercher-collaborateur' },
    { name: 'Rejoindre un projet', slug: 'rejoindre-projet' },
    { name: 'Proposer un projet', slug: 'proposer-projet' },
    { name: 'Équipe temporaire', slug: 'equipe-temporaire' }
  ],
  service: [
    { name: 'Échange de service', slug: 'echange-service' },
    { name: 'Tâches', slug: 'taches' },
    { name: 'Formation', slug: 'formation' },
    { name: 'Prestation', slug: 'prestation' }
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

