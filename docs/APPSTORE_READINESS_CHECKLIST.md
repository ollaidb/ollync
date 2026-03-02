# App Store readiness checklist (Ollync)

## 2) Préparation légale obligatoire

### ✅ Présent dans l'app
- Politique de confidentialité: `/profile/legal/politique-confidentialite`
- Conditions d'utilisation (CGU): `/profile/legal/cgu`
- Conditions de vente (CGV): `/profile/legal/cgv`
- Mentions légales: `/profile/legal/mentions-legales`
- Politique cookies: `/profile/legal/politique-cookies`
- Contact / support: `/profile/contact` (email: `collabbinta@gmail.com`)

### ✅ Mentions paiement / commission / remboursement
- Présentes dans `CGV.tsx`:
  - Paiements in-app vs hors app
  - Commission possible
  - Remboursement (in-app précisé au moment de la transaction, hors app non géré)

## 3) Préparation technique iOS

### ✅ Config appli mobile (Expo) mise à jour
Fichier: `apps/mobile/app.json`
- `ios.associatedDomains` ajouté:
  - `applinks:ollync.app`
  - `applinks:www.ollync.app`
- Permissions iOS ajoutées (`infoPlist`):
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription`
  - `NSMicrophoneUsageDescription`
  - `NSLocationWhenInUseUsageDescription`
- Versioning:
  - `expo.version` présent (`1.0.0`)
  - `ios.buildNumber` présent (`1`)
- Branding de base présent:
  - `name`, `icon`, `splash`, `scheme`

### ⚠️ À finaliser côté infra Apple (manuel)
1. **Universal Links**
   - Publier `apple-app-site-association` sur:
     - `https://ollync.app/.well-known/apple-app-site-association`
     - (optionnel) `https://www.ollync.app/.well-known/apple-app-site-association`
   - Sans ce fichier, `associatedDomains` ne suffit pas.

2. **App Store Connect metadata**
   - Privacy Nutrition Labels
   - Captures d'écran iPhone/iPad
   - Description, mots-clés, catégorie, âge

3. **Suppression de compte in-app**
   - Déjà implémentée côté UI: `/profile/settings` -> suppression compte
   - Vérifier en QA que le RPC `delete_user_account` est bien déployé en prod

4. **Paiements**
   - Services réels: Stripe/Connect
   - Abonnement digital iOS: Apple IAP obligatoire

## QA minimale avant soumission
- Inscription / connexion / reset mot de passe
- Publication annonce + médias + localisation
- Envoi demande / acceptation / messages
- Signalement / blocage
- Suppression compte
- Vérification deep links (`ollync://...` + `https://ollync.app/post/:id`)
