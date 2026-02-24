export const interestCatalog: Record<string, string[]> = {
  'creation-contenu': [
    'Création de contenu',
    'Photo',
    'Vidéo',
    'Live',
    'Interview/Émission',
    'Podcast',
    'UGC',
    'Court-métrage',
    'Média',
    'Newsletter/Magazine/Blog',
    'Chaîne YouTube',
    'Autre'
  ],
  'casting-role': [
    'Figurant',
    'Modèle photo',
    'Modèle vidéo',
    'Voix off',
    'Invité',
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
    'Lieu de loisirs',
    'Lieu de bien-etre',
    'Lieux résidentiels',
    'Lieux professionnels',
    'Autre'
  ],
  'services': [
    'Coaching contenu',
    'Développement business',
    'Branding',
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
  'vente': [
    'Comptes',
    'Matériel',
    'Autre'
  ]
}

export const getInterestOptionsForCategory = (categorySlug: string) => {
  return interestCatalog[categorySlug] || []
}

export const getAllInterestOptions = () => {
  return Object.values(interestCatalog).flat()
}
