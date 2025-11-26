# Ollync - Application de mise en relation

Application de mise en relation avec navigation intuitive et interface moderne.

## Fonctionnalités

- **5 pages principales** : Accueil, Favoris, Publication, Messages, Profil
- **Menu de navigation** : Accès rapide aux différentes sections
- **Page Menu** : Sous-menus pour Match, Recrutement, Service, Mission
- **Header** : Barre de recherche et notifications
- **Footer** : Navigation avec icônes et labels

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Structure du projet

```
src/
├── components/
│   ├── Header.tsx      # En-tête avec recherche et notifications
│   └── Footer.tsx      # Pied de page avec navigation
├── pages/
│   ├── Home.tsx        # Page d'accueil
│   ├── Favorites.tsx   # Page de favoris
│   ├── Publish.tsx     # Page de publication
│   ├── Messages.tsx    # Page de messages
│   ├── Profile.tsx     # Page de profil
│   └── Menu.tsx        # Page de menu avec sous-menus
├── App.tsx             # Composant principal avec routing
└── main.tsx            # Point d'entrée
```

