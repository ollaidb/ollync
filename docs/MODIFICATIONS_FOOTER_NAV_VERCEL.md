# Récapitulatif des modifications – Pied de page et navigation (Vercel)

Document indépendant des changements effectués sur le footer et la barre d’onglets (web + mobile). Utile pour le déploiement Vercel et la revue de code.

---

## 1. App web (src/components)

### Footer.tsx
- **Route active unique** : une seule route active calculée à partir de `location.pathname` (`activePath`), au lieu de tester chaque lien séparément. Évite que l’icône Accueil reste visuellement active sur Favoris / Messages / Profil.
- **Boutons natifs** : `motion.button` (Framer Motion) remplacé par `<button type="button">` pour supprimer les animations de tap partagées qui faisaient réagir l’icône Accueil au clic sur d’autres onglets.
- **Accessibilité** : `aria-current="page"` sur l’onglet actif.

### Footer.css
- **Transitions** : `transition: all 0.2s` → `transition: color 0.2s ease, transform 0.2s ease` pour limiter les effets indésirables.
- **État actif** : `.footer-item.active` avec `transform: none` pour éviter que l’onglet actif hérite du `translateY(-2px)` du hover.
- **Tap** : `-webkit-tap-highlight-color: transparent` ; `:active { opacity: 0.85 }` pour un feedback uniquement sur le bouton pressé.

### Arrondissement (border-radius)
- **Footer** : `border-radius: 24px 24px 0 0` (desktop), `20px 20px 0 0` en `@media (max-width: 768px)`.
- **Icône centrale (Plus)** : `border-radius: 50%` (cercle).
- **Badge (Messages)** : `border-radius: 999px` (pilule).

---

## 2. App mobile Expo (apps/mobile)

### apps/mobile/src/app/(tabs)/_layout.jsx
- **Couleur des icônes** : calcul basé sur `usePathname()` au lieu du `focused` du navigateur, pour éviter les couleurs désynchronisées (icône grise alors qu’on est sur l’onglet, ou l’inverse).
- **Composant TabIcon** : reçoit `pathname` et `tabName`, applique `ACTIVE_COLOR` (#6366F1) ou `INACTIVE_COLOR` (#6B7280) selon la route réelle.

---

## 3. Vercel

- **vercel.json** : inchangé. `buildCommand`, `outputDirectory`, `rewrites` pour SPA déjà configurés.
- Aucune variable d’environnement ou réglage spécifique requis pour ces modifications.

---

## Fichiers modifiés (liste)

| Fichier | Type |
|--------|------|
| `src/components/Footer.tsx` | Web – logique + boutons |
| `src/components/Footer.css` | Web – styles + transitions |
| `apps/mobile/src/app/(tabs)/_layout.jsx` | Mobile – icônes des onglets |

Ces changements sont compatibles avec un déploiement Vercel standard (`npm run build` → `dist`).
