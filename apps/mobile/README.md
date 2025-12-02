# Ollync Mobile

Application mobile Ollync construite avec React Native et Expo Router.

## Installation

```bash
cd apps/mobile
npm install
```

## Démarrage

```bash
# Démarrer le serveur de développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web
npm run web
```

## Structure

```
apps/mobile/src/
├── app/
│   ├── _layout.jsx          # Layout racine avec QueryClient
│   ├── index.jsx            # Redirection vers (tabs)
│   └── (tabs)/
│       ├── _layout.jsx      # Navigation par onglets
│       ├── index.jsx        # Page d'accueil
│       ├── favorites.jsx    # Page favoris
│       └── profile.jsx      # Page profil
├── components/
│   ├── Button.jsx           # Composant bouton réutilisable
│   └── PostCard.jsx        # Carte d'annonce
├── hooks/
│   └── useAuth.js          # Hook d'authentification
├── lib/
│   └── supabaseClient.js   # Client Supabase
└── utils/
    ├── fetchPostsWithRelations.js  # Récupération des posts
    └── postMapper.js               # Mapper les posts
```

## Technologies

- **Expo Router** : Navigation basée sur les fichiers
- **React Native** : Framework mobile
- **Supabase** : Backend et authentification
- **TanStack Query** : Gestion des données
- **Lucide React Native** : Icônes

