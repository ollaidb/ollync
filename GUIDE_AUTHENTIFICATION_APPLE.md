# Guide d'Authentification Apple avec Supabase

Ce guide vous explique comment configurer et utiliser l'authentification Apple (Sign in with Apple) dans votre application Ollync.

## 📋 Prérequis

- Un compte Supabase avec votre projet configuré
- Un compte Apple Developer (payant - $99/an) - **Nécessaire pour Sign in with Apple**
- Les fichiers `Login.tsx` et `Register.tsx` déjà configurés

⚠️ **Important** : Sign in with Apple nécessite un compte Apple Developer payant. Si vous n'en avez pas, vous pouvez utiliser Google uniquement.

## 🔧 Étape 1 : Configuration dans Apple Developer

### 1.1 Créer un Identifiant de Services

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. Connectez-vous avec votre compte Apple Developer
3. Allez dans **Certificates, Identifiers & Profiles**
4. Dans le menu de gauche, cliquez sur **Identifiers**
5. Cliquez sur le bouton **+** pour créer un nouvel identifiant
6. Sélectionnez **Services IDs** et cliquez sur **Continue**
7. Entrez une **Description** : `Ollync Web`
8. Entrez un **Identifier** : `com.ollync.web` (ou votre propre identifiant unique)
9. Cliquez sur **Continue** puis **Register**

### 1.2 Configurer Sign in with Apple

1. Dans la liste des Identifiers, cliquez sur celui que vous venez de créer
2. Cochez la case **Sign in with Apple**
3. Cliquez sur **Configure** à côté de "Sign in with Apple"
4. Dans **Primary App ID**, sélectionnez votre App ID (ou créez-en un si nécessaire)
5. Dans **Website URLs**, configurez :
   - **Domains and Subdomains** : `ollync.app`
   - **Return URLs** : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
     ⚠️ **Important** : Remplacez `abmtxvyycslskmnmlniq` par votre projet Supabase ID si différent
6. Cliquez sur **Save**, puis **Continue**, puis **Register**

### 1.3 Créer une Clé

1. Dans **Certificates, Identifiers & Profiles**, allez dans **Keys**
2. Cliquez sur le bouton **+** pour créer une nouvelle clé
3. Entrez un **Key Name** : `Ollync Sign in with Apple`
4. Cochez **Sign in with Apple**
5. Cliquez sur **Configure** et sélectionnez votre Primary App ID
6. Cliquez sur **Save**, puis **Continue**, puis **Register**
7. ⚠️ **IMPORTANT** : Téléchargez la clé (fichier `.p8`) - **vous ne pourrez la télécharger qu'une seule fois**
8. Notez le **Key ID** affiché

### 1.4 Obtenir votre Team ID

1. Dans le coin supérieur droit du portail Apple Developer, cliquez sur votre nom
2. Votre **Team ID** s'affiche (format : `XXXXXXXXXX`)
3. Notez-le, vous en aurez besoin pour Supabase

## 🔧 Étape 2 : Configuration dans Supabase Dashboard

### 2.1 Activer le provider Apple

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers**
4. Trouvez **Apple** dans la liste
5. Activez le toggle **Enable Apple provider**

### 2.2 Configurer les identifiants Apple

Vous devrez fournir les informations suivantes à Supabase :

1. **Services ID** : L'identifiant que vous avez créé (ex: `com.ollync.web`)
2. **Team ID** : Votre Team ID Apple Developer
3. **Key ID** : L'ID de la clé que vous avez créée
4. **Private Key** : Le contenu du fichier `.p8` que vous avez téléchargé
   - Ouvrez le fichier `.p8` dans un éditeur de texte
   - Copiez tout son contenu (y compris `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`)

### 2.3 Entrer les identifiants dans Supabase

1. Dans Supabase Dashboard > Authentication > Providers > Apple
2. Remplissez les champs :
   - **Services ID** : Votre Services ID (ex: `com.ollync.web`)
   - **Team ID** : Votre Team ID Apple Developer
   - **Key ID** : L'ID de votre clé
   - **Private Key** : Le contenu complet de votre fichier `.p8`
3. Cliquez sur **Save**

### 2.4 Configurer l'URL de redirection

Supabase configure automatiquement l'URL de redirection. Assurez-vous que l'URL dans Apple Developer Portal correspond à :
```
https://[VOTRE-PROJET-ID].supabase.co/auth/v1/callback
```

Vous pouvez trouver votre projet ID dans l'URL de votre dashboard Supabase ou dans votre fichier `supabaseClient.ts`.

## 💻 Étape 3 : Implémentation dans le code

Les fichiers `Login.tsx` et `Register.tsx` ont été mis à jour pour inclure un bouton "Se connecter avec Apple".

### Fonctionnement

Quand un utilisateur clique sur "Se connecter avec Apple" :
1. Il est redirigé vers Apple pour se connecter
2. Après authentification, Apple redirige vers Supabase
3. Supabase crée automatiquement l'utilisateur dans `auth.users`
4. Le trigger `on_auth_user_created` crée automatiquement le profil dans `profiles`
5. L'utilisateur est redirigé vers `/home`

### Données récupérées depuis Apple

Lors de la connexion Apple, Supabase récupère automatiquement :
- **Email** : Depuis le compte Apple (si l'utilisateur autorise)
- **Nom complet** : Depuis le profil Apple (si disponible, stocké dans `user_metadata.full_name`)
- **Identifiant unique** : Fourni par Apple

⚠️ **Note importante** : Apple permet aux utilisateurs de masquer leur email réel en utilisant un email relais (ex: `xxxx@privaterelay.appleid.com`). Votre application doit être préparée à gérer ces emails relais.

Ces données sont automatiquement synchronisées avec la table `profiles` via le trigger existant.

## 🧪 Étape 4 : Tester l'authentification

1. Démarrez votre application en développement :
   ```bash
   npm run dev
   ```

2. Allez sur la page de connexion (`/auth/login`)

3. Cliquez sur "Se connecter avec Apple"

4. Connectez-vous avec votre compte Apple

5. Autorisez l'application

6. Vous devriez être redirigé vers `/home` et connecté

## 🔍 Vérification dans Supabase

Après une connexion Apple réussie, vous pouvez vérifier :

1. **Table `auth.users`** :
   - Un nouvel utilisateur avec `provider = 'apple'`
   - Les métadonnées dans `raw_user_meta_data`
   - L'email peut être un email relais Apple (`xxxx@privaterelay.appleid.com`)

2. **Table `profiles`** :
   - Un profil créé automatiquement avec l'ID de l'utilisateur
   - L'email et le nom complet (si disponible)

## ⚠️ Points importants

### URLs de redirection

Assurez-vous que les URLs de redirection dans Apple Developer Portal incluent :
- Votre domaine de production : `ollync.app`
- L'URL de callback Supabase : `https://[PROJET-ID].supabase.co/auth/v1/callback`

### Gestion des emails relais Apple

Apple permet aux utilisateurs de masquer leur email réel. Votre application doit :
- Gérer les emails au format `xxxx@privaterelay.appleid.com`
- Ne pas demander de confirmation d'email pour les utilisateurs Apple (ils sont déjà vérifiés par Apple)
- Comprendre qu'un utilisateur peut utiliser un email relais différent à chaque connexion (dans certains cas)

### Gestion des profils existants

Si un utilisateur se connecte avec Apple et qu'un compte existe déjà avec le même email :
- Supabase peut soit créer un nouveau compte, soit lier les comptes selon votre configuration
- Par défaut, Supabase crée un nouveau compte même si l'email existe déjà

Pour lier les comptes (recommandé) :
1. Dans Supabase Dashboard > Authentication > Settings
2. Configurez la gestion des comptes multiples selon vos besoins

### Données utilisateur

Les données récupérées depuis Apple sont stockées dans :
- `auth.users.raw_user_meta_data` : Toutes les métadonnées Apple
- `auth.users.user_metadata` : Métadonnées formatées
- `profiles` : Données synchronisées via le trigger

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URL de redirection dans Apple Developer Portal correspond exactement à celle de Supabase
- L'URL doit être : `https://[PROJET-ID].supabase.co/auth/v1/callback`
- Vérifiez que le domaine `ollync.app` est bien configuré dans Apple Developer Portal

### Erreur "invalid_client"

- Vérifiez que le Services ID dans Supabase correspond exactement à celui configuré dans Apple Developer Portal
- Vérifiez que Sign in with Apple est bien activé pour votre Services ID

### Erreur avec la Private Key

- Vérifiez que vous avez copié le contenu complet du fichier `.p8` (y compris les lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`)
- Vérifiez que la Key ID correspond à celle de la clé créée
- Vérifiez que le Team ID est correct

### L'utilisateur n'est pas créé dans profiles

- Vérifiez que le trigger `on_auth_user_created` existe dans votre base de données
- Exécutez le script `supabase/create_profile_trigger.sql` si nécessaire

### Erreur de connexion réseau

- Vérifiez que votre application peut accéder à Supabase
- Vérifiez les CORS dans Supabase Dashboard > Settings > API

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Guide Supabase Apple OAuth](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Developer Portal](https://developer.apple.com/)

## 💡 Notes supplémentaires

- Sign in with Apple fonctionne uniquement sur les domaines HTTPS
- Vous devez avoir un compte Apple Developer payant ($99/an)
- Les utilisateurs peuvent choisir de masquer leur email réel
- Apple fournit toujours un identifiant unique stable pour chaque utilisateur

