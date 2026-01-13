// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible
// Structure mise à jour pour le repositionnement 100% créateurs de contenu

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  'creation-contenu': [
    { name: 'Photo', slug: 'photo' },
    { name: 'Vidéo', slug: 'video' },
    { name: 'Vlog', slug: 'vlog' },
    { name: 'Sketchs', slug: 'sketchs' },
    { name: 'Trends', slug: 'trends' },
    { name: 'Événements', slug: 'evenements' },
    { name: 'Live', slug: 'live' }
  ],
  montage: [
    { name: 'Montage', slug: 'montage' },
    { name: 'micro-trottoir', slug: 'micro-trottoir' },
    { name: 'live', slug: 'live' },
    { name: 'Écriture de contenu', slug: 'ecriture-contenu' }
  ],
  'casting-role': [
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Modèle photo', slug: 'modele-photo' },
    { name: 'Modèle vidéo', slug: 'modele-video' },
    { name: 'Voix off', slug: 'voix-off' },
    { name: 'Invité podcast', slug: 'invite-podcast' },
    { name: 'Invité micro-trottoir', slug: 'invite-micro-trottoir' },
    { name: 'YouTube vidéo', slug: 'youtube-video' }
  ],
  'projets-equipe': [
    { name: 'Recherche équipe', slug: 'recherche-equipe' },
    { name: 'media', slug: 'projet-media' },
    { name: 'YouTube', slug: 'projet-youtube' },
    { name: 'Podcast', slug: 'projet-podcast' },
    { name: 'documentaire', slug: 'projet-documentaire' },
    { name: 'autre', slug: 'autre' }
  ],
  services: [
    { name: 'Coaching contenu', slug: 'coaching-contenu' },
    { name: 'Stratégie éditoriale', slug: 'strategie-editoriale' },
    { name: 'Organisation', slug: 'organisation' },
    { name: 'Setup matériel', slug: 'setup-materiel' }
  ],
  vente: [
    { name: 'Comptes', slug: 'comptes' },
    { name: "Noms d'utilisateur", slug: 'noms-utilisateur' },
    { name: 'Concepts / Niches', slug: 'concepts-niches' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}

