/**
 * Données des guides onboarding Ollync.
 * Chaque slide a un titre obligatoire et un contenu.
 * animatedPhrases: parties de texte à afficher en séquence (ex. "Un projet" → "une annonce" → "une rencontre").
 */

export type OnboardingSlideData = {
  title: string
  content: string
  /** Parties affichées en animation séquencée (une après l’autre). Si présent, content peut compléter après. */
  animatedPhrases?: string[]
  /** Nom d’icône Lucide (optionnel) pour le slide */
  icon?: string
  /** Une seule couleur dominante (fallback si pas de gradient) */
  color?: string
  /** Dégradé de couleurs [début, … fin]. Prioritaire sur color. */
  gradient?: string[]
  /** Layout type Canva : fond corail + formes violettes + "BIENVENUE SUR" / flèche / "Ollync". */
  layout?: 'welcome'
}

export type OnboardingGuideId = 'opening' | 'publish' | 'home' | 'messages' | 'profile'

export type OnboardingGuide = {
  id: OnboardingGuideId
  slides: OnboardingSlideData[]
}

const PUNCHY = {
  orange: '#FF6B35',
  yellow: '#EAB308',
  green: '#10B981',
  blue: '#2563EB',
  violet: '#7C3AED',
  coral: '#E11D48',
  turquoise: '#06B6D4',
  indigo: '#4F46E5'
} as const

export const ONBOARDING_APP_NAME = 'Ollync'

/** Guide ouverture app (avant connexion) — 5 slides */
export const GUIDE_OPENING: OnboardingGuide = {
  id: 'opening',
  slides: [
    {
      title: `Bienvenue sur ${ONBOARDING_APP_NAME}`,
      animatedPhrases: ['Un projet', 'une annonce', 'une rencontre'],
      content: '',
      icon: 'Sparkles',
      color: '#FF6F61',
      gradient: undefined,
      layout: 'welcome'
    },
    {
      title: 'Publie ou cherche',
      content: 'Dépose une offre, poste une demande, parcours les annonces.',
      icon: 'Compass',
      color: PUNCHY.blue,
      gradient: ['#2563EB', '#7C3AED', '#4F46E5']
    },
    {
      title: 'Échange et avance',
      content: 'Messages, matchs, rendez-vous, groupes.',
      icon: 'MessageCircle',
      color: PUNCHY.violet,
      gradient: ['#7C3AED', '#EC4899', '#A855F7']
    },
    {
      title: 'Ton profil, ta vitrine',
      content: 'Présente-toi, gère tes annonces, reste maître de ton activité.',
      icon: 'User',
      color: PUNCHY.green,
      gradient: ['#059669', '#10B981', '#06B6D4']
    },
    {
      title: 'Prêt ?',
      content: 'Inscris-toi.',
      icon: 'LogIn',
      color: PUNCHY.orange,
      gradient: ['#F97316', '#FF6B35', '#E11D48']
    }
  ]
}

/** Guide publication — 4 slides */
export const GUIDE_PUBLISH: OnboardingGuide = {
  id: 'publish',
  slides: [
    {
      title: `Bienvenue sur ${ONBOARDING_APP_NAME}`,
      content: 'Ta première publication en 66 secondes.',
      icon: 'Zap',
      color: PUNCHY.orange,
      gradient: ['#F97316', '#EAB308', '#FF6B35']
    },
    {
      title: 'Choisis, décris, publie',
      content:
        'Offre ou Demande, une catégorie, puis ton titre et ta description. Tu peux aussi indiquer un mode de paiement.',
      icon: 'Edit3',
      color: PUNCHY.blue,
      gradient: ['#2563EB', '#4F46E5', '#7C3AED']
    },
    {
      title: 'Donne envie en un coup d’œil',
      content:
        'Un lieu et des photos (ou une vidéo) : plus c’est clair, plus les bonnes personnes te trouvent.',
      icon: 'Image',
      color: PUNCHY.violet,
      gradient: ['#8B5CF6', '#EC4899', '#A855F7']
    },
    {
      title: 'Publie ta première annonce',
      content: '',
      icon: 'Send',
      color: PUNCHY.green,
      gradient: ['#10B981', '#06B6D4', '#059669']
    }
  ]
}

/** Guide accueil — 3 slides */
export const GUIDE_HOME: OnboardingGuide = {
  id: 'home',
  slides: [
    {
      title: `Bienvenue sur ${ONBOARDING_APP_NAME}`,
      animatedPhrases: ['Un projet', 'une annonce', 'une rencontre'],
      content: 'Découvre des annonces qui matchent.',
      icon: 'Home',
      color: PUNCHY.orange,
      gradient: ['#FF6B35', '#EAB308', '#F97316']
    },
    {
      title: 'Trouve ce qui te ressemble',
      content: 'Filtre par catégorie, déroule le fil. Les bonnes opportunités remontent.',
      icon: 'Filter',
      color: PUNCHY.blue,
      gradient: ['#2563EB', '#7C3AED', '#06B6D4']
    },
    {
      title: 'Publie en un tap',
      content: 'Le + en bas : ton bouton pour déposer une annonce.',
      icon: 'PlusCircle',
      color: PUNCHY.violet,
      gradient: ['#7C3AED', '#EC4899', '#A855F7']
    }
  ]
}

/** Guide messagerie — 4 slides */
export const GUIDE_MESSAGES: OnboardingGuide = {
  id: 'messages',
  slides: [
    {
      title: `Bienvenue sur ${ONBOARDING_APP_NAME}`,
      content: 'Toute ta messagerie au même endroit. Conversations, demandes, matchs.',
      icon: 'MessageCircle',
      color: PUNCHY.blue,
      gradient: ['#2563EB', '#4F46E5', '#7C3AED']
    },
    {
      title: 'Rendez-vous et groupes',
      content: 'Gère tes RDV, crée des groupes, tout depuis ici.',
      icon: 'Calendar',
      color: PUNCHY.violet,
      gradient: ['#7C3AED', '#EC4899', '#A855F7']
    },
    {
      title: 'Tu gardes la main',
      content:
        'Filtre par type (tout, annonces, matchs, groupes…) et vois ce qui attend une réponse.',
      icon: 'SlidersHorizontal',
      color: PUNCHY.green,
      gradient: ['#059669', '#10B981', '#06B6D4']
    },
    {
      title: 'Tout au même endroit',
      content: '',
      icon: 'Inbox',
      color: PUNCHY.turquoise,
      gradient: ['#06B6D4', '#0EA5E9', '#3B82F6']
    }
  ]
}

/** Guide profil public (ce que les autres voient) — 4 slides */
export const GUIDE_PROFILE: OnboardingGuide = {
  id: 'profile',
  slides: [
    {
      title: `Bienvenue sur ${ONBOARDING_APP_NAME}`,
      content: 'Ton profil public, c’est ta vitrine : photo, bio, ce que les autres voient.',
      icon: 'User',
      color: PUNCHY.orange,
      gradient: ['#FF6B35', '#EAB308', '#F97316']
    },
    {
      title: 'Ta vitrine, ta bio',
      content: 'Remplis ta bio et tes liens (réseaux, site). Plus tu complètes, plus tu inspires confiance.',
      icon: 'FileText',
      color: PUNCHY.blue,
      gradient: ['#2563EB', '#7C3AED', '#06B6D4']
    },
    {
      title: 'Ce que les autres voient',
      content: 'Tes annonces et tes infos publiques apparaissent ici. Tu peux modifier ton profil public à tout moment.',
      icon: 'Settings',
      color: PUNCHY.violet,
      gradient: ['#8B5CF6', '#EC4899', '#A855F7']
    },
    {
      title: 'Fais briller ton profil public',
      content: '',
      icon: 'Sparkles',
      color: PUNCHY.green,
      gradient: ['#10B981', '#06B6D4', '#059669']
    }
  ]
}

export const ONBOARDING_GUIDES: Record<OnboardingGuideId, OnboardingGuide> = {
  opening: GUIDE_OPENING,
  publish: GUIDE_PUBLISH,
  home: GUIDE_HOME,
  messages: GUIDE_MESSAGES,
  profile: GUIDE_PROFILE
}

/** À incrémenter à chaque mise à jour des slides : tous les profils revoient les guides. (2 = après intro de la version, pour réafficher à tous.) */
export const ONBOARDING_GUIDES_CONTENT_VERSION = '2'

export const ONBOARDING_STORAGE_KEY_PREFIX = 'ollync_guide_seen_'
