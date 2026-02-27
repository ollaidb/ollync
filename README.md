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

### Tester en PWA sur ton téléphone

L’app est déjà configurée en **PWA** (manifeste + service worker). Tu peux la lancer comme une app sur ton téléphone de deux façons :

**Option 1 – Test en local (même Wi‑Fi)**  
1. Sur ton PC : `npm run dev:mobile` (ou `npm run dev -- --host`).  
2. Note l’URL affichée, par ex. `http://192.168.x.x:3000`.  
3. Sur ton téléphone (même réseau) : ouvre cette URL dans Chrome (Android) ou Safari (iOS).  
4. **Android** : Menu (⋮) → « Ajouter à l’écran d’accueil » ou « Installer l’application ».  
5. **iOS** : Partager → « Sur l’écran d’accueil ».

**Option 2 – Version en ligne (après déploiement)**  
Ouvre **https://ollync.fr** sur ton téléphone, puis utilise le même « Ajouter à l’écran d’accueil » / « Sur l’écran d’accueil ». L’app s’ouvrira en mode standalone (sans barre d’URL).

**Avoir Ollync parmi tes applications (écran d’accueil / tiroir d’apps)**  
Une fois le site déployé et ouvert sur ton téléphone :

- **Sur Android** : ouvre https://ollync.fr dans Chrome → menu (⋮) → « Ajouter à l’écran d’accueil » ou « Installer l’application ». L’icône Ollync apparaîtra sur ton écran d’accueil et dans la liste de tes applications.
- **Sur iPhone/iPad** : ouvre https://ollync.fr dans Safari → touche **Partager** (en bas) → « Sur l’écran d’accueil » → Ajouter. L’icône Ollync apparaîtra sur l’écran d’accueil avec tes autres apps.

Sur mobile, une bannière en bas de l’écran propose aussi d’ajouter l’app à l’écran d’accueil (avec un bouton « Installer » sur Android).

**Installer la PWA sur ton ordinateur (Chrome)**  
- Ouvre l’app dans Chrome → clic sur les **3 points** (en haut à droite) → **« Installer l’application »** (ou « Installer Ollync »).  
- L’app apparaîtra dans le dock, dans tes applications et sur le bureau, et s’ouvrira sans barre d’URL.  
- **Raccourci** : dans la barre d’adresse, ouvre `chrome://apps` pour voir toutes tes PWA installées.

**Prérequis PWA**  
- En local : `localhost` suffit.  
- En ligne : **HTTPS obligatoire** (Vercel le fournit).

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

