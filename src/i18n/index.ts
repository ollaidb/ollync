import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const savedLanguage = localStorage.getItem('app_language') || 'fr'

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      titles: {
        'Apparence': 'Apparence',
        'Notifications': 'Notifications',
        'Mot de passe': 'Mot de passe',
        'Éditer le profil': 'Éditer le profil',
        'Appareils connectés': 'Appareils connectés',
        'Profils bloqués': 'Profils bloqués',
        'Numéro de téléphone': 'Numéro de téléphone',
        'Informations personnelles': 'Informations personnelles',
        'Suppression de compte': 'Suppression de compte',
        'Confirmation de suppression': 'Confirmation de suppression',
        'Connexion à deux étapes': 'Connexion à deux étapes',
        'Mail': 'Mail',
        'Statut en ligne': 'Statut en ligne',
        'Gestion de mes données': 'Gestion de mes données',
        'Sécurité du compte': 'Sécurité du compte',
        'Moyens de paiement': 'Moyens de paiement',
        'Langue': 'Langue'
      },
      categories: {
        titles: {
          'creation-contenu': 'Création de contenu',
          'emploi': 'Emploi',
          'casting-role': 'Casting',
          'studio-lieu': 'Lieu',
          'services': 'Service/Mission',
          'evenements': 'Événement',
          'vente': 'Vente'
        },
        descriptions: {
          'creation-contenu':
            'Créer du contenu ensemble ou se faire aider : photos, vidéos, vlogs, sketchs, trends, lives ou événements',
          'casting-role':
            'Trouver des personnes pour jouer dans un projet (figurants, rôles, comédie, tournage, contenu créatif)',
          'emploi': 'Métiers liés à la création de contenu (vidéo, photo, montage, community, etc.).',
          'studio-lieu':
            'Des lieux pour créer du contenu (shooting, tournage, décor, espaces adaptés).',
          'services':
            'Proposer ou chercher des services dans la création de contenu (coaching contenu, branding, développement business, animation de compte avec visage de marque).',
          'evenements':
            'Participer ou proposer des événements créatifs (masterclass, conférence, débat, atelier).',
          'vente': 'Acheter ou vendre (comptes, matériel).'
        },
        submenus: {
          'tout': 'Tout',
          'photo': 'Photo',
          'video': 'Vidéo',
          'interview-emission': 'Interview/Émission',
          'podcast': 'Podcast',
          'ugc': 'UGC',
          'court-metrage': 'Court-métrage',
          'media': 'Média',
          'newsletter': 'Newsletter/Magazine/Blog',
          'chaine-youtube': 'Chaîne YouTube',
          'live': 'Live',
          'autre': 'Autre',
          'masterclass': 'Masterclass',
          'conference': 'Conférence',
          'debat': 'Débat',
          'atelier': 'Atelier',
          'production-sur-place': 'Production sur place',
          'voyage-deplacement': 'Voyage / déplacement',
          'evenement-sortie': 'Événement / sortie',
          'prestation': 'Prestation',
          'food': 'Food',
          'lieux': 'Lieux',
          'montage': 'Montage',
          'micro-trottoir': 'Micro-trottoir',
          'community-manager': 'Community manager',
          'ecriture-contenu': 'Écriture de contenu',
          'figurant': 'Figurant',
          'modele-photo': 'Modèle photo',
          'modele-video': 'Modèle vidéo',
          'voix-off': 'Voix off',
          'invite': 'Invité',
          'lieu-loisirs': 'Lieu de loisirs',
          'lieu-bien-etre': 'Lieu de bien-etre',
          'lieux-residentiels': 'Lieux résidentiels',
          'lieux-professionnels': 'Lieux professionnels',
          'coaching-contenu': 'Coaching contenu',
          'agence': 'Développement business',
          'branding': 'Branding',
          'animation-compte': 'Animation de compte',
          'comptes': 'Comptes',
          'gorille': 'Matériel'
        },
        ui: {
          viewUsers: 'Voir les utilisateurs',
          viewAll: 'Voir tout',
          searchPlaceholder: 'Rechercher',
          noSubcategories: 'Aucune sous-catégorie disponible',
          searchResults: 'Aucun résultat pour "{{query}}"'
        }
      },
      notifications: {
        title: 'Notifications',
        notConnectedTitle: 'Vous n\'êtes pas connecté',
        notConnectedText: 'Connectez-vous pour accéder à vos notifications',
        register: 'S\'inscrire',
        alreadyAccount: 'Déjà un compte ?',
        signIn: 'Se connecter',
        filters: {
          all: 'Tout',
          like: 'Like',
          message: 'Message',
          request: 'Demande',
          match: 'Match',
          appointment: 'Rendez-vous',
          review: 'Avis',
          news: 'Actualité'
        },
        loading: 'Chargement...',
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        types: {
          like: 'Nouveau like',
          comment: 'Nouveau commentaire',
          message: 'Nouveau message',
          follow: 'Nouvel abonné',
          review: 'Nouvel avis',
          advertisement: 'Nouvelle annonce',
          new_post: 'Nouvelle publication',
          post_updated: 'Publication mise à jour',
          post_closed: 'Publication clôturée',
          match_request_sent: 'Demande de match envoyée',
          match_request_received: 'Demande de match reçue',
          match_request_accepted: 'Demande de match acceptée',
          match_request_declined: 'Demande de match refusée',
          application_sent: 'Candidature envoyée',
          application_received: 'Candidature reçue',
          application_accepted: 'Candidature acceptée',
          application_declined: 'Candidature refusée',
          contract_created: 'Contrat créé',
          contract_signature_required: 'Signature requise',
          contract_signed: 'Contrat signé',
          appointment: 'Rendez-vous',
          appointment_cancelled: 'Rendez-vous annulé',
          post_expiring: 'Annonce qui expire',
          group_added: 'Ajouté à un groupe',
          welcome: 'Bienvenue sur Ollync'
        }
      },
      empty: {
        messagesTitle: 'Vous n\'avez aucun message',
        messagesSubtext: 'Vos messages apparaîtront ici dès que vous en recevrez.',
        notificationsTitle: 'Aucune notification',
        notificationsSubtext: 'Vos notifications s\'afficheront ici lorsqu\'il y aura du nouveau.',
        likesTitle: 'Aucun like pour le moment',
        likesSubtext: 'Les likes apparaîtront ici lorsqu\'un utilisateur aimera l\'une de vos annonces.',
        postsTitle: 'Aucune annonce pour l\'instant',
        postsSubtext: 'Vos annonces seront affichées ici dès que vous en publierez une.',
        matchesTitle: 'Aucun match trouvé',
        matchesSubtext: 'Vos futurs matchs apparaîtront ici lorsqu\'une annonce correspondra à votre recherche.',
        requestsTitle: 'Aucune demande reçue',
        requestsSubtext: 'Les demandes liées à vos annonces seront affichées ici.',
        archivedTitle: 'Aucune archive',
        archivedSubtext: 'Les conversations que vous archivez apparaîtront ici.',
        favoritesTitle: 'Aucun favori',
        favoritesSubtext: 'Ajoutez des annonces en favori pour les retrouver ici.',
        categoryTitle: 'Aucun résultat',
        categorySubtext: 'Aucune annonce n\'est disponible dans cette catégorie pour le moment.',
        profilesTitle: 'Aucun profil suivi',
        profilesSubtext: 'Les profils que vous suivez apparaîtront ici.'
      },
      errors: {
        pushUnsupported: 'Push non supporté sur ce navigateur.',
        pushMissingKey: 'Clé VAPID manquante. Ajoute VITE_WEB_PUSH_PUBLIC_KEY dans .env.',
        pushPermissionDenied: 'Permission refusée pour les notifications.'
      },
      consent: {
        actions: {
          accept: 'J\'accepte',
          decline: 'Refuser',
          askAgain: 'Me redemander la prochaine fois',
          learnMore: 'En savoir plus'
        },
        retryMessage: 'Pour continuer, vous devez accepter.',
        blocked: 'Action impossible sans consentement. Vous pouvez modifier ce choix dans les paramètres de gestion des données.',
        types: {
          location: {
            title: 'Utilisation de la localisation',
            message: 'Nous utilisons votre position pour afficher les annonces proches de vous.'
          },
          media: {
            title: 'Utilisation des médias',
            message: 'Nous utilisons vos photos et vidéos pour publier votre annonce.'
          },
          profile_data: {
            title: 'Utilisation des données de profil',
            message: 'Nous utilisons vos infos de profil pour identifier votre compte.'
          },
          messaging: {
            title: 'Utilisation de la messagerie',
            message: 'Nous utilisons la messagerie pour envoyer, recevoir et garder l’historique des échanges.'
          },
          cookies: {
            title: 'Utilisation des cookies',
            message: 'Nous utilisons des cookies nécessaires, et avec votre accord, des cookies de mesure.'
          },
          behavioral_data: {
            title: 'Analyse d\'utilisation',
            message: 'Nous analysons certaines actions pour améliorer les fonctionnalités.'
          }
        }
      },
      common: {
        back: 'Retour',
        searchLanguagePlaceholder: 'Rechercher une langue',
        currentLanguage: 'Langue actuelle',
        otherLanguages: 'Autres langues',
        noLanguageFound: 'Aucune langue trouvée',
        nav: {
          home: 'Accueil',
          profile: 'Profil',
          messages: 'Messages',
          favorites: 'Favoris',
          notifications: 'Notifications',
          publish: 'Publier'
        },
        actions: {
          publishListing: 'Publier une annonce',
          swipeMode: 'Mode Swipe',
          scan: 'Scanner'
        },
        timeAgo: {
          publishedAt: 'Publié {{text}}',
          todayAt: "Aujourd'hui à {{time}}",
          oneDay: 'il y a un jour',
          days: 'il y a {{count}} jours',
          oneMonth: 'il y a un mois',
          months: 'il y a {{count}} mois',
          oneYear: 'il y a un an',
          years: 'il y a {{count}} ans'
        },
        notFound: {
          title: 'Page introuvable',
          message: 'Cette page n’existe pas ou a été déplacée. Vous pouvez retourner à l’accueil ou faire une recherche.',
          goHome: 'Retour à l’accueil',
          goSearch: 'Rechercher',
          navLabel: 'Navigation page introuvable'
        },
        errorBoundary: {
          title: 'Une erreur s’est produite',
          message: 'Le chargement de cette page a échoué. Vous pouvez réessayer ou retourner à l’accueil.',
          retry: 'Réessayer',
          goHome: 'Retour à l’accueil',
          navLabel: 'Actions en cas d’erreur'
        },
        meta: {
          defaultTitle: 'Ollync - Mise en relation pour créateurs',
          defaultDescription: 'Plateforme de mise en relation pour créateurs de contenu. Publiez des annonces, trouvez des profils et collaborez sur des projets créatifs.',
          home: { title: 'Accueil', description: 'Découvrez les annonces et trouvez des créateurs de contenu sur Ollync.' },
          search: { title: 'Recherche', description: 'Recherchez des annonces par catégorie, lieu et critères.' },
          profile: { title: 'Mon profil', description: 'Gérez votre profil Ollync.' },
          profilePublic: { title: 'Profil', description: 'Profil créateur sur Ollync.' },
          post: { title: 'Annonce', description: 'Détail de l\'annonce sur Ollync.' },
          publish: { title: 'Publier une annonce', description: 'Publiez votre annonce en quelques étapes.' },
          favorites: { title: 'Favoris', description: 'Vos annonces et profils favoris.' },
          messages: { title: 'Messages', description: 'Vos conversations sur Ollync.' },
          notifications: { title: 'Notifications', description: 'Vos notifications.' },
          login: { title: 'Connexion', description: 'Connectez-vous à votre compte Ollync.' },
          register: { title: 'Inscription', description: 'Créez votre compte Ollync.' },
          notFound: { title: 'Page introuvable', description: 'Cette page n’existe pas.' }
        },
        auth: {
          invalidCredentials: "L'email ou le mot de passe est incorrect."
        }
      },
      home: {
        loading: 'Chargement...',
        urgent: 'Urgent',
        recommendations: 'Recommandations',
        recent: 'Annonce récente',
        searchPlaceholder: 'Rechercher sur ollync',
        searchPlaceholderShort: 'Rechercher sur ollync',
        welcome: 'BIENVENUE',
        heroTitle: 'Bienvenue sur Ollync',
        heroSubtitle: 'La plateforme de mise en relation pour créateurs de contenu',
        discover: 'Découvrir',
        welcomeSuffix: 'sur Ollyc'
      },
      messages: {
        title: 'Messages', // Nom de la page messagerie
        searchPlaceholder: 'Rechercher une conversation'
      },
      search: {
        inputPlaceholder: 'Rechercher...',
        locationPlaceholder: 'Rechercher un lieu (ex: Paris, Lyon...)',
        searching: 'Recherche en cours...',
        emptyTitle: 'Rechercher une annonce',
        recentSearches: 'Recherches récentes',
        suggestions: 'Suggestions',
        removeSearch: 'Supprimer cette recherche',
        closeSuggestions: 'Fermer les suggestions'
      },
      favorites: {
        title: 'Favoris',
        searchAria: 'Rechercher',
        followedProfiles: 'Profils suivis',
        notConnectedTitle: "Vous n'êtes pas connecté",
        notConnectedText: 'Connectez-vous pour accéder à vos favoris',
        register: "S'inscrire",
        alreadyAccount: 'Déjà un compte ?',
        signIn: 'Se connecter',
        tabPosts: 'Publications',
        tabProfiles: 'Profils suivis'
      },
      publish: {
        title: 'Publier une annonce',
        step0Title: "Type d'annonce",
        step0Instruction: 'Sélectionnez la catégorie qui correspond à votre besoin',
        offerTitle: 'Demande',
        offerDescription: 'Je demande un service',
        requestTitle: 'Offre',
        requestDescription: 'Je propose un service',
        step1Title: "Quel type d'annonce souhaitez-vous publier?",
        step1Instruction: 'Sélectionnez la catégorie qui correspond à votre besoin',
        guideAria: 'Ouvrir le guide de publication',
        guideTitle: 'Guide de publication'
      },
      settings: {
        title: 'Paramètres',
        personalInfo: 'Informations personnelles',
        mail: 'Mail',
        onlineStatus: 'Statut en ligne',
        payment: 'Moyens de paiement',
        appearance: 'Apparence',
        notifications: 'Notifications',
        language: 'Langue',
        dataManagement: 'Gestion de mes données',
        deleteAccount: 'Suppression de compte',
        moderation: 'Modération',
        downloadMyData: 'Télécharger mes données',
        downloadMyDataDescription: 'Export de vos données personnelles (profil, annonces, messages envoyés, notifications, etc.) en PDF lisible, conformément au droit à la portabilité (RGPD).',
        downloadMyDataSuccess: 'Téléchargement lancé.',
        downloadMyDataError: 'Impossible de préparer l’export. Réessayez plus tard.',
        exportPreparing: 'Préparation…'
      },
      profile: {
        accountTitle: 'Mon compte',
        annoncesTitle: 'Mes annonces',
        contractsTitle: 'Contrat',
        walletTitle: 'Porte-monnaie',
        transactionsTitle: 'Transactions',
        ticketsTitle: 'Billets',
        candidatureTitle: 'Espace candidat',
        helpTitle: 'Aide',
        contactTitle: 'Contact',
        resourcesTitle: 'Ressources',
        resourcesBusinessTitle: 'Créer son entreprise',
        resourcesIncomeTitle: 'Déclarer ses revenus',
        legalTitle: 'Informations légales',
        wallet: 'Porte-monnaie',
        annonces: 'Annonces',
        contracts: 'Contrats',
        transactions: 'Transactions',
        tickets: 'Billets',
        candidature: 'Espace candidat',
        security: 'Connexion et sécurité',
        help: 'Aide',
        contact: 'Contact',
        resources: 'Ressources',
        resourcesBusiness: 'Créer son entreprise',
        resourcesIncome: 'Déclarer ses revenus',
        legal: 'Informations légales',
        logout: 'Déconnexion',
        logoutTitle: 'Déconnexion',
        logoutMessage: 'Voulez-vous vraiment vous déconnecter ?',
        logoutConfirm: 'Déconnexion',
        cancel: 'Annuler',
        loginRequiredTitle: 'Connexion requise',
        loginRequiredText: 'Connectez-vous pour accéder à votre profil',
        loginButton: 'Se connecter',
        notConnectedTitle: 'Vous n\'êtes pas connecté',
        notConnectedText: 'Connectez-vous pour accéder à votre profil',
        registerButton: 'S\'inscrire',
        alreadyAccount: 'Déjà un compte ?',
        signInLink: 'Se connecter',
        userFallback: 'Utilisateur'
      }
    },
    en: {
      titles: {
        'Apparence': 'Appearance',
        'Notifications': 'Notifications',
        'Mot de passe': 'Password',
        'Éditer le profil': 'Edit profile',
        'Appareils connectés': 'Connected devices',
        'Profils bloqués': 'Blocked profiles',
        'Numéro de téléphone': 'Phone number',
        'Informations personnelles': 'Personal information',
        'Suppression de compte': 'Delete account',
        'Confirmation de suppression': 'Delete confirmation',
        'Connexion à deux étapes': 'Two-factor authentication',
        'Mail': 'Email',
        'Statut en ligne': 'Online status',
        'Gestion de mes données': 'Data management',
        'Sécurité du compte': 'Account security',
        'Moyens de paiement': 'Payment methods',
        'Langue': 'Language'
      },
      categories: {
        titles: {
          'creation-contenu': 'Content creation',
          'emploi': 'Jobs',
          'casting-role': 'Casting',
          'studio-lieu': 'Location',
          'services': 'Service/Mission',
          'evenements': 'Events',
          'vente': 'Sales'
        },
        descriptions: {
          'creation-contenu': 'Create content together: photos, videos, vlogs, sketches, trends, lives, or events.',
          'casting-role':
            'Find people to act in a project (extras, roles, comedy, filming, creative content).',
          'emploi': 'Jobs related to content creation (video, photo, editing, community, etc.).',
          'studio-lieu': 'Find places to create content (shoots, filming, sets, suitable spaces).',
          'services':
            'Offer or look for content-creation services (content coaching, branding, business development, account management with brand face).',
          'evenements': 'Join or propose creative events (masterclass, conference, debate, workshop).',
          'vente': 'Buy or sell (accounts, equipment).'
        },
        submenus: {
          'tout': 'All',
          'photo': 'Photo',
          'video': 'Video',
          'interview-emission': 'Interview/Show',
          'podcast': 'Podcast',
          'ugc': 'UGC',
          'court-metrage': 'Short film',
          'media': 'Media',
          'newsletter': 'Newsletter/Magazine/Blog',
          'chaine-youtube': 'YouTube channel',
          'live': 'Live',
          'autre': 'Other',
          'masterclass': 'Masterclass',
          'conference': 'Conference',
          'debat': 'Debate',
          'atelier': 'Workshop',
          'production-sur-place': 'On-site production',
          'voyage-deplacement': 'Travel / trip',
          'evenement-sortie': 'Event / outing',
          'prestation': 'Service',
          'food': 'Food',
          'lieux': 'Places',
          'montage': 'Editing',
          'micro-trottoir': 'Street interview',
          'community-manager': 'Community manager',
          'ecriture-contenu': 'Content writing',
          'figurant': 'Extra',
          'modele-photo': 'Photo model',
          'modele-video': 'Video model',
          'voix-off': 'Voice-over',
          'invite': 'Guest',
          'lieu-loisirs': 'Leisure place',
          'lieu-bien-etre': 'Well-being place',
          'lieux-residentiels': 'Residential places',
          'lieux-professionnels': 'Professional places',
          'coaching-contenu': 'Content coaching',
          'agence': 'Business development',
          'branding': 'Branding',
          'animation-compte': 'Account management',
          'comptes': 'Accounts',
          'gorille': 'Equipment'
        },
        ui: {
          viewUsers: 'View users',
          viewAll: 'View all',
          searchPlaceholder: 'Search',
          noSubcategories: 'No subcategory available',
          searchResults: 'No results for "{{query}}"'
        }
      },
      notifications: {
        title: 'Notifications',
        notConnectedTitle: 'You are not signed in',
        notConnectedText: 'Sign in to access your notifications',
        register: 'Sign up',
        alreadyAccount: 'Already have an account?',
        signIn: 'Sign in',
        filters: {
          all: 'All',
          like: 'Like',
          message: 'Message',
          request: 'Request',
          match: 'Match',
          appointment: 'Appointment',
          review: 'Review',
          news: 'News'
        },
        loading: 'Loading...',
        today: 'Today',
        yesterday: 'Yesterday',
        types: {
          like: 'New like',
          comment: 'New comment',
          message: 'New message',
          follow: 'New follower',
          review: 'New review',
          advertisement: 'New listing',
          new_post: 'New post',
          post_updated: 'Post updated',
          post_closed: 'Post closed',
          match_request_sent: 'Match request sent',
          match_request_received: 'Match request received',
          match_request_accepted: 'Match request accepted',
          match_request_declined: 'Match request declined',
          application_sent: 'Application sent',
          application_received: 'Application received',
          application_accepted: 'Application accepted',
          application_declined: 'Application declined',
          contract_created: 'Contract created',
          contract_signature_required: 'Signature required',
          contract_signed: 'Contract signed',
          appointment: 'Appointment',
          appointment_cancelled: 'Appointment cancelled',
          post_expiring: 'Post expiring',
          group_added: 'Added to a group',
          welcome: 'Welcome to Ollync'
        }
      },
      empty: {
        messagesTitle: 'No messages yet',
        messagesSubtext: 'Your messages will appear here as soon as you receive some.',
        notificationsTitle: 'No notifications',
        notificationsSubtext: 'Your notifications will show up here when there is something new.',
        likesTitle: 'No likes yet',
        likesSubtext: 'Likes will appear here when someone likes one of your posts.',
        postsTitle: 'No listings yet',
        postsSubtext: 'Your listings will appear here once you publish one.',
        matchesTitle: 'No matches found',
        matchesSubtext: 'Your future matches will appear here when a listing matches your search.',
        requestsTitle: 'No requests received',
        requestsSubtext: 'Requests related to your listings will be displayed here.',
        archivedTitle: 'No archived chats',
        archivedSubtext: 'Conversations you archive will appear here.',
        favoritesTitle: 'No favorites',
        favoritesSubtext: 'Add listings to favorites to find them here.',
        categoryTitle: 'No results',
        categorySubtext: 'No listings are available in this category for now.',
        profilesTitle: 'No followed profiles',
        profilesSubtext: 'Profiles you follow will appear here.'
      },
      errors: {
        pushUnsupported: 'Push notifications are not supported on this browser.',
        pushMissingKey: 'Missing VAPID key. Add VITE_WEB_PUSH_PUBLIC_KEY to .env.',
        pushPermissionDenied: 'Permission denied for notifications.'
      },
      consent: {
        actions: {
          accept: 'I agree',
          decline: 'Decline',
          askAgain: 'Ask me again next time',
          learnMore: 'Learn more'
        },
        retryMessage: 'To continue, you must accept.',
        blocked: 'This action requires consent. You can update this choice in data management settings.',
        types: {
          location: {
            title: 'Location usage',
            message: 'We use your location to show nearby listings.'
          },
          media: {
            title: 'Media usage',
            message: 'We use your photos and videos to publish your listing.'
          },
          profile_data: {
            title: 'Profile data usage',
            message: 'We use your profile info to identify your account.'
          },
          messaging: {
            title: 'Messaging usage',
            message: 'We use messaging to send, receive, and keep conversation history.'
          },
          cookies: {
            title: 'Cookies usage',
            message: 'We use necessary cookies and, with your consent, analytics cookies.'
          },
          behavioral_data: {
            title: 'Usage analysis',
            message: 'We analyze some actions to improve features.'
          }
        }
      },
      common: {
        back: 'Back',
        searchLanguagePlaceholder: 'Search for a language',
        currentLanguage: 'Current language',
        otherLanguages: 'Other languages',
        noLanguageFound: 'No language found',
        nav: {
          home: 'Home',
          profile: 'Profile',
          messages: 'Messages',
          favorites: 'Favorites',
          notifications: 'Notifications',
          publish: 'Publish'
        },
        actions: {
          publishListing: 'Post a listing',
          swipeMode: 'Swipe mode',
          scan: 'Scan'
        },
        timeAgo: {
          publishedAt: 'Published {{text}}',
          todayAt: 'Today at {{time}}',
          oneDay: '1 day ago',
          days: '{{count}} days ago',
          oneMonth: '1 month ago',
          months: '{{count}} months ago',
          oneYear: '1 year ago',
          years: '{{count}} years ago'
        },
        notFound: {
          title: 'Page not found',
          message: 'This page does not exist or has been moved. You can go back to the home page or search.',
          goHome: 'Back to home',
          goSearch: 'Search',
          navLabel: 'Page not found navigation'
        },
        errorBoundary: {
          title: 'Something went wrong',
          message: 'This page failed to load. You can try again or go back to the home page.',
          retry: 'Try again',
          goHome: 'Back to home',
          navLabel: 'Error recovery actions'
        },
        meta: {
          defaultTitle: 'Ollync - Connecting creators',
          defaultDescription: 'Platform connecting content creators. Post listings, find profiles and collaborate on creative projects.',
          home: { title: 'Home', description: 'Discover listings and find content creators on Ollync.' },
          search: { title: 'Search', description: 'Search listings by category, location and filters.' },
          profile: { title: 'My profile', description: 'Manage your Ollync profile.' },
          profilePublic: { title: 'Profile', description: 'Creator profile on Ollync.' },
          post: { title: 'Listing', description: 'Listing details on Ollync.' },
          publish: { title: 'Post a listing', description: 'Post your listing in a few steps.' },
          favorites: { title: 'Favorites', description: 'Your favorite listings and profiles.' },
          messages: { title: 'Messages', description: 'Your conversations on Ollync.' },
          notifications: { title: 'Notifications', description: 'Your notifications.' },
          login: { title: 'Sign in', description: 'Sign in to your Ollync account.' },
          register: { title: 'Sign up', description: 'Create your Ollync account.' },
          notFound: { title: 'Page not found', description: 'This page does not exist.' }
        },
        auth: {
          invalidCredentials: 'Invalid email or password.'
        }
      },
      home: {
        loading: 'Loading...',
        urgent: 'Urgent',
        recommendations: 'Recommendations',
        recent: 'Recent listings',
        searchPlaceholder: 'Search on Ollync',
        searchPlaceholderShort: 'Search on Ollync',
        welcome: 'WELCOME',
        heroTitle: 'Welcome to Ollync',
        heroSubtitle: 'The platform connecting content creators',
        discover: 'Discover',
        welcomeSuffix: 'on Ollyc'
      },
      messages: {
        title: 'Messages', // Nom de la page messagerie
        searchPlaceholder: 'Search a conversation'
      },
      search: {
        inputPlaceholder: 'Search...',
        locationPlaceholder: 'Search a location (e.g. Paris, Lyon...)',
        searching: 'Searching...',
        emptyTitle: 'Search a listing',
        recentSearches: 'Recent searches',
        suggestions: 'Suggestions',
        removeSearch: 'Remove this search',
        closeSuggestions: 'Close suggestions'
      },
      favorites: {
        title: 'Favorites',
        searchAria: 'Search',
        followedProfiles: 'Followed profiles',
        notConnectedTitle: 'You are not signed in',
        notConnectedText: 'Sign in to access your favorites',
        register: 'Sign up',
        alreadyAccount: 'Already have an account?',
        signIn: 'Sign in',
        tabPosts: 'Posts',
        tabProfiles: 'Followed profiles'
      },
      publish: {
        title: 'Post a listing',
        step0Title: 'Listing type',
        step0Instruction: 'Select the category that matches your need',
        offerTitle: 'Request',
        offerDescription: 'I request a service.',
        requestTitle: 'Offer',
        requestDescription: 'I offer a service.',
        step1Title: 'What type of listing would you like to publish?',
        step1Instruction: 'Select the category that matches your need',
        guideAria: 'Open the publishing guide',
        guideTitle: 'Publishing guide'
      },
      settings: {
        title: 'Settings',
        personalInfo: 'Personal information',
        mail: 'Email',
        onlineStatus: 'Online status',
        payment: 'Payment methods',
        appearance: 'Appearance',
        notifications: 'Notifications',
        language: 'Language',
        dataManagement: 'Data management',
        deleteAccount: 'Delete account',
        moderation: 'Moderation',
        downloadMyData: 'Download my data',
        downloadMyDataDescription: 'Export your personal data (profile, listings, messages you sent, notifications, etc.) as a readable PDF, in line with the right to data portability (GDPR).',
        downloadMyDataSuccess: 'Download started.',
        downloadMyDataError: 'Could not prepare export. Please try again later.',
        exportPreparing: 'Preparing…'
      },
      profile: {
        accountTitle: 'My account',
        annoncesTitle: 'My listings',
        contractsTitle: 'Contract',
        walletTitle: 'Wallet',
        transactionsTitle: 'Transactions',
        ticketsTitle: 'Tickets',
        candidatureTitle: 'Candidate area',
        helpTitle: 'Help',
        contactTitle: 'Contact',
        resourcesTitle: 'Resources',
        resourcesBusinessTitle: 'Start a business',
        resourcesIncomeTitle: 'Declare income',
        legalTitle: 'Legal information',
        wallet: 'Wallet',
        annonces: 'Listings',
        contracts: 'Contracts',
        transactions: 'Transactions',
        tickets: 'Tickets',
        candidature: 'Candidate area',
        security: 'Sign in & security',
        help: 'Help',
        contact: 'Contact',
        resources: 'Resources',
        resourcesBusiness: 'Start a business',
        resourcesIncome: 'Declare income',
        legal: 'Legal information',
        logout: 'Log out',
        logoutTitle: 'Log out',
        logoutMessage: 'Do you really want to log out?',
        logoutConfirm: 'Log out',
        cancel: 'Cancel',
        loginRequiredTitle: 'Sign in required',
        loginRequiredText: 'Sign in to access your profile',
        loginButton: 'Sign in',
        notConnectedTitle: 'You are not signed in',
        notConnectedText: 'Sign in to access your profile',
        registerButton: 'Sign up',
        alreadyAccount: 'Already have an account?',
        signInLink: 'Sign in',
        userFallback: 'User'
      }
    }
  },
  lng: savedLanguage,
  fallbackLng: 'fr',
  ns: [
    'common',
    'consent',
    'settings',
    'profile',
    'titles',
    'categories',
    'notifications',
    'empty',
    'errors',
    'home',
    'messages',
    'search',
    'favorites',
    'publish'
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false
  }
})

document.documentElement.lang = savedLanguage

export default i18n
