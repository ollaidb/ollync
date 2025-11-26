// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  match: [
    { name: 'Création de contenu', slug: 'creation-contenu' },
    { name: 'Sortie', slug: 'sortie' },
    { name: 'Événement', slug: 'evenement' }
  ],
  recrutement: [
    { name: 'Modèle', slug: 'modele' },
    { name: 'Figurant', slug: 'figurant' }
  ],
  projet: [
    { name: 'Associer / Collaboration', slug: 'associer-collaboration' }
  ],
  service: [
    { name: 'Échange de service', slug: 'echange-service' },
    { name: 'Tâches', slug: 'taches' },
    { name: 'Formation', slug: 'formation' }
  ],
  vente: [
    { name: 'Échange', slug: 'echange' },
    { name: 'Vente de compte', slug: 'vente-compte' },
    { name: 'Gratuit', slug: 'gratuit' }
  ],
  mission: [
    { name: 'Colis', slug: 'colis' },
    { name: 'Vérification', slug: 'verification' }
  ],
  autre: [
    { name: 'Non classé', slug: 'non-classe' },
    { name: 'Autre service', slug: 'autre-service' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}

