# Récapitulatif des fonctionnalités et éléments mis en place — Ollync

Document de référence : mesures de sécurité, blocs, animations, pages, version web vs mobile, PWA.

---

## 1. Mesures de sécurité

### 1.1 Version Web (front + Supabase)

- **RLS (Row Level Security)** activé sur les tables : `profiles`, `sub_categories`, `posts`, `likes`, `favorites`, `comments`, `shares`, `applications`, `follows`, `conversations`, `conversation_participants`, `messages`, `notifications`, `matches`.
- **Policies posts** : lecture des posts actifs par tous ; insertion/mise à jour/suppression uniquement pour le propriétaire (`auth.uid() = user_id`). Script dédié : `secure_posts_rls_and_view.sql`.
- **Pages privées** : liste définie dans `src/utils/privatePaths.ts` — `/messages`, `/notifications`, `/favorites`, `/likes`, `/publish`, `/publier-annonce`, `/moderation`, `/profile` et sous-chemins sauf `/profile/public` et `/profile/public/*`. Utilisé pour la redirection après perte de session.
- **Session expirée** : `SessionExpiredHandler` détecte le passage de connecté à non connecté sur une page privée et redirige vers `/auth/login?returnTo=...` sauf si la déconnexion a été initiée par l’utilisateur (`ollync-logout-initiated` en sessionStorage).
- **Protection des données (pas de suppression physique)** :
  - **Annonces** : pas de DELETE sur `posts` ; suppression via RPC `delete_own_post` (soft delete `status = 'deleted'`). Modération via `delete_post_as_admin` en soft delete.
  - **Messages** : pas de DELETE ; soft delete via `is_deleted`, `deleted_for_user_id`, `is_deleted_for_all`. Script `persist_conversations_content.sql` pour éviter la perte de contenu.
  - **Historique de recherche** : pas de politique DELETE ; traces conservées.
- **Page Sécurité utilisateur** : `/profile/security` avec sous-pages (sécurité du compte, mot de passe, téléphone, 2FA, appareils, profils bloqués). Option modération pour un email dédié.
- **Modération** : page `/moderation` réservée aux modérateurs (vérification par email). Bloc « Accès réservé » si non connecté, « Accès refusé » si connecté mais pas modérateur.

### 1.2 Règles Cursor / bonnes pratiques code

- **Règle Snyk** (`.cursor/rules/snyk_rules.mdc`) : exécuter `snyk_code_scan` pour le nouveau code first-party, corriger les problèmes trouvés et rescanner jusqu’à ce qu’il n’y en ait plus.

---

## 2. Version mobile tactile — ce qui a été mis en place

- **Détection mobile** : `useIsMobile()` (breakpoint 768px). Classe `app--mobile` / `app--web` et `data-platform="mobile"` sur le conteneur principal.
- **Swipe retour (iOS-like)** : composant `SwipeBack` — glissement depuis le bord gauche pour revenir en arrière sur les pages secondaires (conversation, sous-pages profil, détail annonce). Seulement sur mobile.
- **Pull to refresh** : composant `PullToRefresh` + hook `usePullToRefresh`. Utilisé sur Home, Feed, Favorites, Messages (liste), Notifications, Search, Annonces, SwipePage, CategoryPage, RecentPosts, UrgentPosts, UsersPage. Souvent activé uniquement sur mobile (`enabled={isMobile}`) sur certaines pages.
- **Modales en bottom-sheet sur mobile** : `ConfirmationModal` avec `presentation="bottom-sheet"` (adaptation clavier + safe area). Utilisé pour confirmations de suppression, annulation de demande, etc. sur PostDetails, Messages, PublicProfile, Annonces.
- **Swipe horizontal** : carousel d’onboarding (guide) avec seuil de swipe et drag ; page PostRecommendations en mode « swipe » (cartes).
- **Touch sur messages** : swipe droite sur un message pour « répondre » (reply), avec haptique léger (`hapticLight()`).
- **Listes swipeables** : `SwipeableListItem` pour actions sur une ligne (ex. suppression).
- **Transition de route** : animation légère (framer-motion) à chaque changement de page ; `route-transition-shell` avec opacity.
- **Footer navigation** : sur mobile, pas de header classique ; contenu principal + footer avec 5 onglets (Accueil, Favoris, Publier, Messages, Profil).
- **Skip link** : lien « Aller au contenu principal » pour l’accessibilité.

---

## 3. Types de blocs

### 3.1 Blocs de consentement

- **ConsentModal** : modal réutilisable pour demander le consentement avant une action. Géré par `useConsent(consentType)`.
- **Types de consentement** (`ConsentType`) : `location`, `media`, `profile_data`, `messaging`, `cookies`, `behavioral_data`.
- **Comportement** : accepter / refuser ; option « redemander la prochaine fois » ; action en attente exécutée après acceptation. Stockage local + synchro optionnelle profil (Supabase). Cookies : délai ~5 min avant première demande, clé globale.
- **Pages légales liées** : `CONSENT_TO_LEGAL_PAGE.cookies` (politique cookies). Lien « En savoir plus » renvoie vers la page légale avec `returnTo` pour revenir.

### 3.2 Blocs de validation / confirmation

- **ConfirmationModal** : modal de confirmation générique (titre, message, boutons Annuler / Confirmer). Supporte `isDestructive`, `compact`, `presentation: 'center' | 'bottom-sheet'`.
- **Usages** : suppression d’annonce (PostDetails), suppression de conversation (Messages), annulation de demande de match, refus de demande, annulation de RDV, suppression de brouillon/contrat dans MessageInput, suppression de profil/annonce en modération, suppression de compte, déconnexion d’un appareil, etc.

### 3.3 Blocs de suppression (confirmations dédiées)

- Suppression d’annonce : « Supprimer l’annonce » — irréversible (ConfirmationModal + RPC soft delete).
- Suppression de conversation : « Supprimer la conversation » (Messages).
- Suppression / annulation de demande de match (Messages).
- Annulation de RDV (Messages).
- Suppression brouillon / contrat (MessageInput) — overlay dédié « Supprimer le brouillon » / « Supprimer le contrat » avec mention « Cette suppression est définitive ».
- Modération : confirmation avant suppression définitive profil ou annonce (modérateur).
- Compte : page DeleteAccount avec confirmation.

### 3.4 Blocs de rappel (demande d’action)

- **ReminderBlock** : overlay avec titre, message, boutons « Ne plus demander » et action principale. Alimenté par le hook `useReminder()`.
- **Types de rappel** : `draft` (brouillons à terminer), `messages` (messages non lus), `notifications` (notifications non lues), `publish` (invitation à publier une annonce).
- **Règles** : pas de rappel pendant le cooldown global (5 min), pas juste après le splash (2 min), pas juste après un bloc de consentement (2 min). Brouillons : max 1 fois par semaine ; « Ne plus demander » persiste en localStorage.
- **ReminderBlock** : accessible (role="dialog", aria-modal, aria-labelledby/describedby), bouton fermer, actions claires.

### 3.5 Blocs pour pages vides

- **EmptyState** (composant principal) : types `messages`, `notifications`, `likes`, `posts`, `matches`, `requests`, `archived`, `favorites`, `category`, `profiles`. Chaque type a icône, titre et sous-texte (i18n). Optionnel : `actionLabel` + `onAction`, et variante `marketing` avec `marketingTone` (purple, orange, teal, blue).
- **EmptyState profil** (ProfilePage) : variante avec `title`, `message`, `icon` (package, users, star).
- **Recherche** : état vide spécifique « Aucun résultat pour cette recherche » avec bouton « Réinitialiser les filtres ».

### 3.6 Blocs pour pages privées (accès sans connexion)

- **Profil** : si `!user && !isPublicProfile`, affichage d’un écran « Pas connecté » (icône User, titre, texte, bouton Inscription, lien Connexion). Les routes `/profile/public` et `/profile/public/:id` restent accessibles sans compte.
- **Modération** : si non connecté → bloc « Accès réservé » + bouton « Se connecter ». Si connecté mais pas modérateur → « Accès refusé ».
- **privatePaths** + **SessionExpiredHandler** : redirection vers login avec `returnTo` quand la session est perdue sur une page privée (sauf déconnexion volontaire).

### 3.7 Autres blocs / overlays

- **SaveChangesModal** : pour confirmer quitter sans sauvegarder (ex. édition profil).
- **Questionnaire de personnalisation** : `PersonalizationQuestionnaire` — affiché une fois connecté (sauf sur pages auth), avec possibilité de compléter ou « Passer / rappeler plus tard ».

---

## 4. Animations et écrans de transition

- **Écran de lancement (Splash)** : `SplashScreen` — plein écran avec nom de l’app (Ollync), tagline avec phrases en séquence, animations CSS (fade, évaporation). Durée ~5,6 s puis callback `onComplete`. Gestion `ollync_splash_completed_at` en sessionStorage. Option « skip » au logout (`ollync-skip-splash-logout`).
- **Animation après connexion** : `AuthTransitionOverlay` — affichée sur `/home` quand `location.state.authTransition === true`. Réutilise `AuthBackground`, affichage ~2,4 s puis fondu et `onComplete` → navigation vers `/home`.
- **Transition de route** : `motion.div` (framer-motion) avec `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, durée 0,2 s, sur le contenu des routes (web et mobile).
- **Splash mobile (app Expo)** : `expo-splash-screen` dans `apps/mobile` ; écran de démarrage avec image et couleur de fond.

---

## 5. Slides (guides et recommandations)

### 5.1 Guide d’ouverture (avant connexion)

- **OnboardingCarousel** + **onboardingGuides** : guide `opening` — 5 slides (« Bienvenue sur Ollync », « Publie ou cherche », « Échange et avance », « Ton profil, ta vitrine », « Prêt ? »). Swipe tactile/souris, boutons Continuer / Passer, dernier slide avec CTA Inscription et Connexion. Layout « welcome » (fond corail + formes) sur le premier slide.

### 5.2 Guides contextuels (après connexion)

- **Guides par zone** : `home` (3 slides), `publish` (4), `messages` (4), `profile` (4). Même composant `OnboardingCarousel` + `OnboardingSlide`. Stockage « déjà vu » par guide et version du contenu (`ONBOARDING_GUIDES_CONTENT_VERSION`, `ONBOARDING_STORAGE_KEY_PREFIX`).

### 5.3 Recommandations

- **Section « Pour vous »** (accueil) : `RecommendationsSection` — affiche des annonces recommandées (likes, recherches, publications, demandes). Cachée si pas d’actions ou pas de recommandations.
- **Page recommandations liées à une annonce** : `PostRecommendations` (`/post/:id/recommendations`) — liste (ou grille swipe) d’annonces similaires avec navigation vers le détail.

---

## 6. Écran d’erreur

- **ErrorBoundary** : composant React qui intercepte les erreurs de rendu. En cas d’erreur : page dédiée avec icône, titre et message (i18n), boutons « Réessayer » (reload) et « Accueil » (redirect `/home`). Utilise `window.location` pour rester fiable même si le contexte React est dégradé.
- **NotFound (404)** : page avec code 404, titre, message et liens « Accueil » et « Recherche » (`/home`, `/search`). Style aligné avec ErrorBoundary.

---

## 7. PWA et « Ajouter à l’écran d’accueil »

- **Manifest** : `public/manifest.json` et `public/manifest.webmanifest` — nom, short_name, description, start_url, display standalone, theme_color, background_color, icônes 192 et 512.
- **Service worker** : `public/sw.js` pour le cache (offline).
- **Documentation** (README) : instructions pour tester en local (`npm run dev:mobile` / `--host`) et sur téléphone (Chrome Android : « Ajouter à l’écran d’accueil » / « Installer l’application » ; iOS Safari : Partager → « Sur l’écran d’accueil »). Sur déploiement (ex. https://ollync.fr), même procédure ; bannière possible en bas sur mobile pour proposer l’installation.
- **Installation sur ordinateur** : Chrome → « Installer l’application » / « Installer Ollync ». Prérequis : HTTPS en production.

---

## 8. Liste des pages (routes)

- **Accueil / navigation** : `/`, `/home`, `/feed`, `/favorites`, `/likes`, `/search`, `/urgent`, `/recent`.
- **Publication** : `/publish`, `/publier-annonce`.
- **Messages** : `/messages`, `/messages/:id`, `/messages/:id/info`, `/messages/:id/media`, `/messages/:id/appointments`, `/messages/:id/contracts`, `/messages/:id/posts`.
- **Profil** : `/profile`, `/profile/public`, `/profile/public/:id`, `/profile/edit`, `/profile/settings` + sous-pages (personal-info, mail, online-status, payment, appearance, notifications, language, data-management, delete-account), `/profile/security` + sous-pages (account-security, password, phone, two-factor, devices, blocked-profiles, moderation), `/profile/help`, `/profile/contact`, `/profile/resources` + (creation-entreprise, declaration-revenus), `/profile/legal` + (mentions-legales, politique-confidentialite, cgu, cgv, politique-cookies, securite), `/profile/annonces`, `/profile/contracts`, `/profile/wallet`, `/profile/transactions`, `/profile/tickets`, `/profile/candidature`, `/profile/espace-candidat`, `/profile/:id`.
- **Catégories** : `/creation-contenu`, `/casting-role`, `/emploi`, `/studio-lieu`, `/services`, `/evenements`, `/vente` (avec sous-menus dynamiques).
- **Annonces** : `/post/:id`, `/post/:id/recommendations`.
- **Autres** : `/swipe`, `/users`, `/notifications`, `/moderation`, `/auth/login`, `/auth/register`, `/auth/reset-password`.
- **Fallback** : `*` → `NotFound`.

---

## 9. Résumé des actions importantes côté utilisateur

- Connexion / Inscription / Reset password.
- Consentement (cookies et autres types) via ConsentModal.
- Rappels (brouillons, messages non lus, notifications, publier) via ReminderBlock.
- Questionnaire de personnalisation (une fois connecté).
- Confirmations avant suppression (annonce, conversation, match, RDV, brouillon/contrat, compte, appareil, modération).
- Pages vides avec EmptyState et parfois action (ex. « Réinitialiser les filtres »).
- Accès refusé / pas connecté sur profil (hors public) et modération.
- Gestion de session expirée (redirection login avec returnTo).
- Erreur applicative (ErrorBoundary) et 404 (NotFound).
- Navigation : swipe retour (mobile), pull to refresh, bottom-sheet sur modales (mobile).
- Guides (ouverture + contextuels) et recommandations (« Pour vous », page recommandations par annonce).
- PWA : ajout à l’écran d’accueil / installation sur bureau.

---

*Document généré à partir du code et de la configuration du projet Ollync.*
