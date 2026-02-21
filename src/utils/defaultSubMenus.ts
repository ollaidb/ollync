// Sous-menus par défaut pour chaque catégorie
// Utilisés quand la base de données n'est pas accessible
// Structure mise à jour pour le repositionnement 100% créateurs de contenu

export const DEFAULT_SUBMENUS: Record<string, Array<{ name: string; slug: string }>> = {
  'creation-contenu': [
    { name: 'Photo', slug: 'photo' },
    { name: 'Vidéo', slug: 'video' },
    { name: 'Live', slug: 'live' },
    { name: 'Interview/Émission', slug: 'interview-emission' },
    { name: 'Podcast', slug: 'podcast' },
    { name: 'Court-métrage', slug: 'court-metrage' },
    { name: 'Magazine/Blog', slug: 'magazine-blog' },
    { name: 'Média', slug: 'media' },
    { name: 'Newsletter', slug: 'newsletter' },
    { name: 'Chaîne YouTube', slug: 'chaine-youtube' },
    { name: 'Autre', slug: 'autre' }
  ],
  emploi: [
    { name: 'Montage', slug: 'montage' },
    { name: 'micro-trottoir', slug: 'micro-trottoir' },
    { name: 'Community manager', slug: 'community-manager' },
    { name: 'live', slug: 'live' },
    { name: 'Écriture de contenu', slug: 'ecriture-contenu' },
    { name: 'Autre', slug: 'autre' }
  ],
  'casting-role': [
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Modèle photo', slug: 'modele-photo' },
    { name: 'Modèle vidéo', slug: 'modele-video' },
    { name: 'Voix off', slug: 'voix-off' },
    { name: 'Invité', slug: 'invite' },
    { name: 'Autre', slug: 'autre' }
  ],
  'studio-lieu': [
    { name: 'Lieu de loisirs', slug: 'lieu-loisirs' },
    { name: 'Lieu de bien-etre', slug: 'lieu-bien-etre' },
    { name: 'Lieux résidentiels', slug: 'lieux-residentiels' },
    { name: 'Lieux professionnels', slug: 'lieux-professionnels' },
    { name: 'Autre', slug: 'autre' }
  ],
  services: [
    { name: 'Coaching contenu', slug: 'coaching-contenu' },
    { name: 'Développement business', slug: 'agence' },
    { name: 'Branding', slug: 'branding' },
    { name: 'Animation de compte', slug: 'animation-compte' },
    { name: 'Autre', slug: 'autre' }
  ],
  evenements: [
    { name: 'Masterclass', slug: 'masterclass' },
    { name: 'Conférence', slug: 'conference' },
    { name: 'Débat', slug: 'debat' },
    { name: 'Atelier', slug: 'atelier' },
    { name: 'Autre', slug: 'autre' }
  ],
  vente: [
    { name: 'Comptes', slug: 'comptes' },
    { name: 'Matériel', slug: 'gorille' },
    { name: 'Autre', slug: 'autre' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}
