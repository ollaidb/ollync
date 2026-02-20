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
    { name: 'Live', slug: 'live' },
    { name: 'Autre', slug: 'autre' }
  ],
  emploi: [
    { name: 'Montage', slug: 'montage' },
    { name: 'micro-trottoir', slug: 'micro-trottoir' },
    { name: 'Community manager', slug: 'community-manager' },
    { name: 'live', slug: 'live' },
    { name: 'Écriture de contenu', slug: 'ecriture-contenu' },
    { name: 'Scénariste', slug: 'scenariste' },
    { name: 'Autre', slug: 'autre' }
  ],
  'poste-service': [
    { name: 'Prestation', slug: 'prestation' },
    { name: 'Food', slug: 'food' },
    { name: 'Lieux', slug: 'lieux' },
    { name: 'Autre', slug: 'autre' }
  ],
  'casting-role': [
    { name: 'Figurant', slug: 'figurant' },
    { name: 'Modèle photo', slug: 'modele-photo' },
    { name: 'Modèle vidéo', slug: 'modele-video' },
    { name: 'Voix off', slug: 'voix-off' },
    { name: 'Invité podcast', slug: 'invite-podcast' },
    { name: 'Invité micro-trottoir', slug: 'invite-micro-trottoir' },
    { name: 'YouTube vidéo', slug: 'youtube-video' },
    { name: 'Autre', slug: 'autre' }
  ],
  'studio-lieu': [
    { name: 'Studio de création', slug: 'studio-creation' },
    { name: 'Lieux résidentiels', slug: 'lieux-residentiels' },
    { name: 'Lieux professionnels', slug: 'lieux-professionnels' },
    { name: 'Autre', slug: 'autre' }
  ],
  'projets-equipe': [
    { name: 'Émission', slug: 'projet-emission' },
    { name: 'Newsletter', slug: 'projet-newsletter' },
    { name: 'Interview', slug: 'projet-interview' },
    { name: 'Podcast', slug: 'projet-podcast' },
    { name: 'Documentaire', slug: 'projet-documentaire' },
    { name: 'Court-métrage', slug: 'projet-court-metrage' },
    { name: 'Chaîne YouTube', slug: 'projet-youtube' },
    { name: 'Magazine', slug: 'projet-magazine' },
    { name: 'Blog', slug: 'projet-blog' },
    { name: 'Média', slug: 'projet-media' },
    { name: 'Autre', slug: 'autre' }
  ],
  services: [
    { name: 'Coaching contenu', slug: 'coaching-contenu' },
    { name: 'Stratégie éditoriale', slug: 'strategie-editoriale' },
    { name: 'Organisation', slug: 'organisation' },
    { name: 'Agence', slug: 'agence' },
    { name: 'Branding', slug: 'branding' },
    { name: 'Analyse de profil', slug: 'analyse-profil' },
    { name: 'Proposition d’idées', slug: 'proposition-idees' },
    { name: 'Assistant créateur', slug: 'assistant-createur' },
    { name: 'Monétisation audience', slug: 'monetisation-audience' },
    { name: 'Aisance caméra', slug: 'aisance-camera' },
    { name: 'Setup matériel', slug: 'setup-materiel' },
    { name: 'Autre', slug: 'autre' }
  ],
  evenements: [
    { name: 'Masterclass', slug: 'masterclass' },
    { name: 'Conférence', slug: 'conference' },
    { name: 'Débat', slug: 'debat' },
    { name: 'Atelier', slug: 'atelier' },
    { name: 'Autre', slug: 'autre' }
  ],
  suivi: [
    { name: 'Production sur place', slug: 'production-sur-place' },
    { name: 'Voyage / déplacement', slug: 'voyage-deplacement' },
    { name: 'Événement / sortie', slug: 'evenement-sortie' },
    { name: 'Autre', slug: 'autre' }
  ],
  vente: [
    { name: 'Comptes', slug: 'comptes' },
    { name: "Noms d'utilisateur", slug: 'noms-utilisateur' },
    { name: 'Concepts / Niches', slug: 'concepts-niches' },
    { name: 'Matériel', slug: 'gorille' },
    { name: 'Autre', slug: 'autre' }
  ]
}

export const getDefaultSubMenus = (categorySlug: string): Array<{ name: string; slug: string }> => {
  return DEFAULT_SUBMENUS[categorySlug] || []
}
