import { Camera, Scissors, Users, Briefcase, Wrench, ShoppingBag, Building2, Calendar, ClipboardList } from 'lucide-react'

export interface Platform {
  id: string
  name: string
  icon?: string
}

export interface Option {
  id: string
  name: string
  platforms?: Platform[]
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  description?: string
  options?: Option[]
}

export interface PublicationType {
  id: string
  name: string
  slug: string
  icon: typeof Users
  color: string
  description: string
  subcategories: Subcategory[]
}

// Ordre des catégories : Création de contenu, Casting, Emploi, Lieu, Projet, Service/Mission, Événement, Suivi, Vente, Poste/Service
export const publicationTypes: PublicationType[] = [
  {
    id: 'creation-contenu',
    name: 'Création de contenu',
    slug: 'creation-contenu',
    icon: Camera,
    color: '#667eea',
    description:
      'Créer du contenu ensemble ou se faire aider : photos, vidéos, vlogs, sketchs, trends, lives ou événements. Chercher, proposer ou collaborer à plusieurs.',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'photo',
        name: 'Photo',
        slug: 'photo',
        description:
          'Se faire photographier ou photographier quelqu’un : photos naturelles, Insta, soirée, anniversaire, souvenirs, photos surprises. Chercher, proposer ou shooter à plusieurs.'
      },
      {
        id: 'video',
        name: 'Vidéo',
        slug: 'video',
        description:
          'Se faire filmer, filmer quelqu’un ou créer à plusieurs : contenus simples, face-cam, playback, duo, podcasts, interviews, événements, snap. Chercher, proposer ou collaborer.'
      },
      {
        id: 'vlog',
        name: 'Vlog',
        slug: 'vlog',
        description:
          "Être filmé(e) ou filmer quelqu'un pour un vlog, comme un caméraman (suivre la personne, filmage naturel, plans en mouvement, soirée, anniversaire)."
      },
      {
        id: 'sketchs',
        name: 'Sketchs',
        slug: 'sketchs',
        description:
          'Jouer des rôles dans un script ou un scénario (amis, comédie, mise en scène, personnages, sketch de couple, famille, etc.).'
      },
      {
        id: 'trends',
        name: 'Trends',
        slug: 'trends',
        description:
          'Réaliser des trends/défis qui nécessitent un partenaire (choré, duo, challenges, formats viraux).'
      },
      {
        id: 'live',
        name: 'Live',
        slug: 'live',
        description:
          'Animer un live à deux ou échanger sur un sujet précis (débat, discussion, partage d’avis, co-animation).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'casting-role',
    name: 'Casting',
    slug: 'casting-role',
    icon: Users,
    color: '#2196f3',
    description:
      'Trouver des personnes pour jouer dans un projet (figurants, rôles, comédie, tournage, contenu créatif). Chercher, proposer ou collaborer à plusieurs.',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'figurant',
        name: 'Figurant',
        slug: 'figurant',
        description:
          'Rechercher des figurants pour apparaître dans un projet (vidéo, comédie, clip, tournage, contenu créatif). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'modele-photo',
        name: 'Modèle photo',
        slug: 'modele-photo',
        description:
          'Trouver des modèles pour des photos de projet ou de mise en valeur (make-up, coiffure, ongles, skincare, vêtements, chaussures, sport, lifestyle, animaux, etc.). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'modele-video',
        name: 'Modèle vidéo',
        slug: 'modele-video',
        description:
          'Trouver des modèles pour apparaître dans des vidéos ou clips (présentation produit, mise en scène, contenu créatif, lookbook, sport, lifestyle, etc.). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'voix-off',
        name: 'Voix off',
        slug: 'voix-off',
        description:
          'Rechercher une voix pour narrer, présenter ou poser un texte (pub, documentaire, story, vidéo explicative, intro, outro). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'invite-podcast',
        name: 'Invité podcast',
        slug: 'invite-podcast',
        description:
          'Inviter une personne pour intervenir, partager son avis ou discuter d’un thème précis dans un podcast. Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'invite-micro-trottoir',
        name: 'Invité micro-trottoir',
        slug: 'invite-micro-trottoir',
        description:
          'Trouver des personnes à interviewer dehors pour des questions, réactions ou témoignages. Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'youtube-video',
        name: 'YouTube vidéo',
        slug: 'youtube-video',
        description:
          'Inviter quelqu’un pour une vidéo YouTube (débat, témoignage, concept, vlog, challenge, réaction, interview). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories. Chercher, proposer ou collaborer à plusieurs.'
      }
    ]
  },
  {
    id: 'emploi',
    name: 'Emploi',
    slug: 'emploi',
    icon: Scissors,
    color: '#9c27b0',
    description: 'Métiers liés à la création de contenu (vidéo, photo, montage, community, etc.).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'montage',
        name: 'Montage',
        slug: 'montage',
        description:
          'Chercher quelqu’un pour faire le montage de vidéos ou photos (formats courts, longues vidéos, retouches, assemblage complet).'
      },
      {
        id: 'micro-trottoir',
        name: 'micro-trottoir',
        slug: 'micro-trottoir',
        description:
          'Recruter une personne pour réaliser des micro-trottoirs (interviewer des gens dans la rue pour votre projet ou contenu).'
      },
      {
        id: 'community-manager',
        name: 'Community manager',
        slug: 'community-manager',
        description:
          'Gérer la communauté et les réseaux (planning, publications, engagement, réponses, animation).'
      },
      {
        id: 'live',
        name: 'live',
        slug: 'live',
        description:
          'Trouver quelqu’un pour animer des lives autour de vos produits, services ou contenus à promouvoir sur les réseaux.'
      },
      {
        id: 'ecriture-contenu',
        name: 'Écriture de contenu',
        slug: 'ecriture-contenu',
        description:
          'Trouver une personne pour écrire du contenu pour vos projets (scripts, textes, idées, publications, etc.).'
      },
      {
        id: 'scenariste',
        name: 'Scénariste',
        slug: 'scenariste',
        description:
          'Écrire des scripts et scénarios pour des vidéos, projets ou contenus.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'studio-lieu',
    name: 'Lieu',
    slug: 'studio-lieu',
    icon: Building2,
    color: '#f59e0b',
    description: 'Des lieux pour créer du contenu (shooting, tournage, décor, espaces adaptés).',
    subcategories: [
      {
        id: 'studio-creation',
        name: 'Studio de création',
        slug: 'studio-creation',
        description:
          'Louer un studio équipé pour créer du contenu (photos, vidéos, interviews, tournages), parfois avec matériel disponible.'
      },
      {
        id: 'lieux-residentiels',
        name: 'Lieux résidentiels',
        slug: 'lieux-residentiels',
        description:
          'Louer un appartement ou une maison pour quelques heures afin de créer du contenu dans un cadre réel.'
      },
      {
        id: 'lieux-professionnels',
        name: 'Lieux professionnels',
        slug: 'lieux-professionnels',
        description:
          'Louer un espace professionnel pour produire du contenu (bureaux, salles de réunion, conférences, lives, interviews).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'projets-equipe',
    name: 'Projet',
    slug: 'projets-equipe',
    icon: Briefcase,
    color: '#4facfe',
    description:
      'Monter une équipe pour réaliser un vrai projet créatif de A à Z. Chercher, proposer ou collaborer à plusieurs.',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'projet-emission',
        name: 'Émission',
        slug: 'projet-emission',
        description:
          'Trouver des personnes pour créer une émission (concept, tournage, animation, montage, diffusion). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-newsletter',
        name: 'Newsletter',
        slug: 'projet-newsletter',
        description:
          'Monter une équipe pour lancer une newsletter (idées, écriture, design, diffusion, croissance). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-interview',
        name: 'Interview',
        slug: 'projet-interview',
        description:
          'Créer une série d’interviews avec une équipe (invités, préparation, tournage, montage). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-podcast',
        name: 'Podcast',
        slug: 'projet-podcast',
        description:
          'Lancer un podcast avec des profils complémentaires (animation, technique, contenu, diffusion). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-documentaire',
        name: 'Documentaire',
        slug: 'projet-documentaire',
        description:
          'Monter une équipe pour réaliser un documentaire (recherche, tournage, montage, narration). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-court-metrage',
        name: 'Court-métrage',
        slug: 'projet-court-metrage',
        description:
          'Créer un court-métrage avec une équipe (scénario, tournage, rôles, montage). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-youtube',
        name: 'Chaîne YouTube',
        slug: 'projet-youtube',
        description:
          'Monter une équipe pour une chaîne YouTube (idées, tournage, montage, rôles). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-magazine',
        name: 'Magazine',
        slug: 'projet-magazine',
        description:
          'Créer un magazine avec une équipe (rédaction, design, contenu, publication). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-blog',
        name: 'Blog',
        slug: 'projet-blog',
        description:
          'Lancer un blog avec des personnes complémentaires (écriture, contenu, stratégie, diffusion). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'projet-media',
        name: 'Média',
        slug: 'projet-media',
        description:
          'Créer un média avec une équipe (ligne éditoriale, production, diffusion, croissance). Chercher, proposer ou collaborer à plusieurs.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories. Chercher, proposer ou collaborer à plusieurs.'
      }
    ]
  },
  {
    id: 'services',
    name: 'Service/Mission',
    slug: 'services',
    icon: Wrench,
    color: '#43e97b',
    description:
      'Proposer ou chercher des services dans la création de contenu (coaching contenu, stratégie éditoriale, organisation, agence, setup matériel, visage de marque, animation de compte).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'coaching-contenu',
        name: 'Coaching contenu',
        slug: 'coaching-contenu',
        description:
          'Coaching pour la création de contenu et la direction artistique (idées, formats, publication, rythme, optimisation du compte).'
      },
      {
        id: 'strategie-editoriale',
        name: 'Stratégie éditoriale',
        slug: 'strategie-editoriale',
        description:
          'Définir votre ligne éditoriale et votre plan de contenu (quoi publier, quand, sur quel réseau).'
      },
      {
        id: 'organisation',
        name: 'Organisation',
        slug: 'organisation',
        description:
          'Aide à organiser la production de contenu (planning, fréquence, workflow, gestion des posts).'
      },
      {
        id: 'agence',
        name: 'Agence',
        slug: 'agence',
        description:
          'Agence qui gère vos collaborations et opportunités (mise en relation, partenariats, pourcentage).'
      },
      {
        id: 'branding',
        name: 'Branding',
        slug: 'branding',
        description:
          'Construire l’image de marque d’un créateur (identité, positionnement, cohérence visuelle).'
      },
      {
        id: 'analyse-profil',
        name: 'Analyse de profil',
        slug: 'analyse-profil',
        description:
          'Analyser un profil créateur pour identifier points forts, axes d’amélioration et opportunités.'
      },
      {
        id: 'proposition-idees',
        name: 'Proposition d’idées',
        slug: 'proposition-idees',
        description:
          'Proposer des idées et concepts de contenus adaptés à un créateur ou une niche.'
      },
      {
        id: 'assistant-createur',
        name: 'Assistant créateur',
        slug: 'assistant-createur',
        description:
          'Assister un créateur dans la production et l’organisation de ses contenus.'
      },
      {
        id: 'monetisation-audience',
        name: 'Monétisation audience',
        slug: 'monetisation-audience',
        description:
          'Aider un créateur à monétiser son audience (offres, partenariats, produits, stratégie).'
      },
      {
        id: 'aisance-camera',
        name: 'Aisance caméra',
        slug: 'aisance-camera',
        description:
          'Aider un créateur à être à l’aise face caméra (posture, voix, présence, confiance).'
      },
      {
        id: 'setup-materiel',
        name: 'Setup matériel',
        slug: 'setup-materiel',
        description:
          'Accompagnement pour installer un setup de création (décor, éclairage, espace, optimisation du lieu).'
      },
      {
        id: 'visage-marque',
        name: 'Visage de marque',
        slug: 'visage-marque',
        description:
          'Incarner une marque de manière régulière à travers des vidéos, photos ou contenus publiés sur les réseaux.'
      },
      {
        id: 'animation-compte',
        name: 'Animation de compte',
        slug: 'animation-compte',
        description:
          'Gestion et publication régulière de contenu sur un compte pour faire vivre la marque dans le temps.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'evenements',
    name: 'Événement',
    slug: 'evenements',
    icon: Calendar,
    color: '#06b6d4',
    description: 'Participer ou proposer des événements créatifs (masterclass, conférence, débat, atelier).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'masterclass',
        name: 'Masterclass',
        slug: 'masterclass',
        description:
          'Participer à une masterclass ou en proposer une autour de la création de contenu.'
      },
      {
        id: 'conference',
        name: 'Conférence',
        slug: 'conference',
        description:
          'Trouver ou proposer une conférence autour des médias, réseaux sociaux et création de contenu.'
      },
      {
        id: 'debat',
        name: 'Débat',
        slug: 'debat',
        description:
          'Organiser ou rejoindre un débat sur un sujet de création de contenu.'
      },
      {
        id: 'atelier',
        name: 'Atelier',
        slug: 'atelier',
        description:
          'Proposer ou rejoindre un atelier pratique (tournage, montage, stratégie, storytelling, etc.).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'suivi',
    name: 'Suivi',
    slug: 'suivi',
    icon: ClipboardList,
    color: '#14b8a6',
    description: 'Suivi terrain et accompagnement (production sur place, déplacement, événement/sortie).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'production-sur-place',
        name: 'Production sur place',
        slug: 'production-sur-place',
        description:
          'Être accompagné(e) sur place pour produire du contenu pendant une activité ou un tournage.'
      },
      {
        id: 'voyage-deplacement',
        name: 'Voyage / déplacement',
        slug: 'voyage-deplacement',
        description:
          'Trouver un accompagnement pour un voyage ou un déplacement lié à la création de contenu.'
      },
      {
        id: 'evenement-sortie',
        name: 'Événement / sortie',
        slug: 'evenement-sortie',
        description:
          'Suivi pendant une sortie ou un événement pour capter et organiser la production de contenu.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'vente',
    name: 'Vente',
    slug: 'vente',
    icon: ShoppingBag,
    color: '#f093fb',
    description:
      'Acheter ou vendre (comptes, noms d\'utilisateur, concepts, matériel).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'comptes',
        name: 'Comptes',
        slug: 'comptes',
        description:
          'Vendre un compte déjà créé avec son audience, son thème ou son historique.'
      },
      {
        id: 'noms-utilisateur',
        name: 'Noms d\'utilisateur',
        slug: 'noms-utilisateur',
        description:
          'Vendre un nom d’utilisateur disponible ou rare, utile pour un nouveau projet.'
      },
      {
        id: 'concepts-niches',
        name: 'Concepts / Niches',
        slug: 'concepts-niches',
        description:
          'Vendre des idées ou concepts de création de contenu (thèmes, niches, formats, concepts YouTube/TikTok).'
      },
      {
        id: 'gorille',
        name: 'Matériel',
        slug: 'gorille',
        description:
          'Vendre du matériel de création de contenu (caméra, micro, éclairage, téléphone, fond, setup, etc.), neuf ou déjà utilisé.'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  },
  {
    id: 'poste-service',
    name: 'Poste/Service',
    slug: 'poste-service',
    icon: Briefcase,
    color: '#f97316',
    description: 'Échange service ↔ visibilité (prestataire propose un service, créateur offre la visibilité).',
    subcategories: [
      {
        id: 'tout',
        name: 'Tout',
        slug: 'tout'
      },
      {
        id: 'prestation',
        name: 'Prestation',
        slug: 'prestation',
        description:
          'Prestations de services (ongles, maquillage, coiffure, massage, épilation, soins esthétiques, etc.).'
      },
      {
        id: 'food',
        name: 'Food',
        slug: 'food',
        description:
          'Établissements de restauration (restaurants, cafés, bars, etc.).'
      },
      {
        id: 'lieux',
        name: 'Lieux',
        slug: 'lieux',
        description:
          'Lieux à proposer ou à découvrir (hôtels, lieux touristiques, espaces de loisirs, boîtes de nuit, etc.).'
      },
      {
        id: 'autre',
        name: 'Autre',
        slug: 'autre',
        description:
          'Choisir autre si vous ne trouvez pas ce que vous cherchez dans la liste des sous-catégories.'
      }
    ]
  }
]
