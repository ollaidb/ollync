export const interestCatalog: Record<string, string[]> = {
  'creation-contenu': [
    'Création de contenu',
    'Photo',
    'Vidéo',
    'Vlog',
    'Sketchs',
    'Trends',
    'Live',
    'Autre'
  ],
  'casting-role': [
    'Figurant',
    'Modèle photo',
    'Modèle vidéo',
    'Voix off',
    'Invité podcast',
    'Invité micro-trottoir',
    'YouTube vidéo',
    'Autre'
  ],
  'emploi': [
    'Montage',
    'micro-trottoir',
    'live',
    'Écriture de contenu',
    'Autre'
  ],
  'studio-lieu': [
    'Studio de création',
    'Lieux résidentiels',
    'Lieux professionnels'
  ],
  'projets-equipe': [
    'Émission',
    'Newsletter',
    'Interview',
    'Podcast',
    'Chaîne YouTube',
    'Magazine',
    'Blog',
    'Média',
    'Autre'
  ],
  'services': [
    'Coaching contenu',
    'Stratégie éditoriale',
    'Organisation',
    'Agence',
    'Setup matériel',
    'Visage de marque',
    'Animation de compte',
    'Autre'
  ],
  'evenements': [
    'Masterclass',
    'Conférence',
    'Débat',
    'Atelier',
    'Autre'
  ],
  'suivi': [
    'Production sur place',
    'Voyage / déplacement',
    'Événement / sortie',
    'Autre'
  ],
  'vente': [
    'Comptes',
    "Noms d'utilisateur",
    'Concepts / Niches',
    'Matériel',
    'Autre'
  ],
  'poste-service': [
    'Prestation',
    'Food',
    'Lieux',
    'Autre'
  ]
}

export const getInterestOptionsForCategory = (categorySlug: string) => {
  return interestCatalog[categorySlug] || []
}

export const getAllInterestOptions = () => {
  return Object.values(interestCatalog).flat()
}
