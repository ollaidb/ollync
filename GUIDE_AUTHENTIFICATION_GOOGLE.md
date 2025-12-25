# Guide d'Authentification Google avec Supabase

Ce guide vous explique comment configurer et utiliser l'authentification Google dans votre application Ollync.

## 📋 Prérequis

- Un compte Supabase avec votre projet configuré
- Un compte Google Cloud Platform (gratuit)
- Les fichiers `Login.tsx` et `Register.tsx` déjà configurés

## 🔧 Étape 1 : Configuration dans Google Cloud Platform

### 1.1 Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez le nom de votre projet

### 1.2 Configurer l'écran de consentement OAuth

1. Dans Google Cloud Console, allez dans **APIs & Services** > **OAuth consent screen**
2. Choisissez **External** (pour les tests) ou **Internal** (si vous avez Google Workspace)
3. Remplissez les informations :
   - **App name** : Ollync
   - **User support email** : Votre email
   - **Developer contact information** : Votre email
4. Cliquez sur **Save and Continue**
5. Pour les scopes, gardez les valeurs par défaut et continuez
6. Ajoutez vos emails de test si nécessaire
7. Finalisez la configuration

### 1.3 Créer les identifiants OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Choisissez **Web application** comme type
4. Configurez :
   - **Name** : Ollync Web Client
   - **Authorized JavaScript origins** :
     ```
     http://localhost:5173
     http://localhost:3000
     https://ollync.app
     ```
   - **Authorized redirect URIs** :
     ```
     https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback
     ```
     ⚠️ **Important** : Remplacez `abmtxvyycslskmnmlniq` par votre projet Supabase ID si différent
5. Cliquez sur **Create**
6. **Copiez le Client ID et le Client Secret** - vous en aurez besoin pour Supabase

## 🔧 Étape 2 : Configuration dans Supabase Dashboard

### 2.1 Activer le provider Google

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers**
4. Trouvez **Google** dans la liste
5. Activez le toggle **Enable Google provider**
6. Entrez vos identifiants :
   - **Client ID (for OAuth)** : Collez le Client ID de Google Cloud
   - **Client Secret (for OAuth)** : Collez le Client Secret de Google Cloud
7. Cliquez sur **Save**

### 2.2 Configurer l'URL de redirection

Supabase configure automatiquement l'URL de redirection. Assurez-vous que l'URL dans Google Cloud Console correspond à :
```
https://[VOTRE-PROJET-ID].supabase.co/auth/v1/callback
```

Vous pouvez trouver votre projet ID dans l'URL de votre dashboard Supabase ou dans votre fichier `supabaseClient.ts`.

## 💻 Étape 3 : Implémentation dans le code

Les fichiers `Login.tsx` et `Register.tsx` ont été mis à jour pour inclure un bouton "Se connecter avec Google".

### Fonctionnement

Quand un utilisateur clique sur "Se connecter avec Google" :
1. Il est redirigé vers Google pour se connecter
2. Après authentification, Google redirige vers Supabase
3. Supabase crée automatiquement l'utilisateur dans `auth.users`
4. Le trigger `on_auth_user_created` crée automatiquement le profil dans `profiles`
5. L'utilisateur est redirigé vers `/home`

### Données récupérées depuis Google

Lors de la connexion Google, Supabase récupère automatiquement :
- **Email** : Depuis le compte Google
- **Nom complet** : Depuis le profil Google (stocké dans `user_metadata.full_name`)
- **Photo de profil** : URL de l'avatar Google (stocké dans `user_metadata.avatar_url`)

Ces données sont automatiquement synchronisées avec la table `profiles` via le trigger existant.

## 🧪 Étape 4 : Tester l'authentification

1. Démarrez votre application en développement :
   ```bash
   npm run dev
   ```

2. Allez sur la page de connexion (`/auth/login`)

3. Cliquez sur "Se connecter avec Google"

4. Sélectionnez votre compte Google

5. Autorisez l'application

6. Vous devriez être redirigé vers `/home` et connecté

## 🔍 Vérification dans Supabase

Après une connexion Google réussie, vous pouvez vérifier :

1. **Table `auth.users`** :
   - Un nouvel utilisateur avec `provider = 'google'`
   - Les métadonnées dans `raw_user_meta_data`

2. **Table `profiles`** :
   - Un profil créé automatiquement avec l'ID de l'utilisateur
   - L'email et le nom complet (si disponible)

## ⚠️ Points importants

### URLs de redirection

Assurez-vous que les URLs de redirection dans Google Cloud Console incluent :
- Votre URL de développement locale (ex: `http://localhost:5173`)
- Votre URL de production : `https://ollync.app`
- L'URL de callback Supabase : `https://[PROJET-ID].supabase.co/auth/v1/callback`

### Gestion des profils existants

Si un utilisateur se connecte avec Google et qu'un compte existe déjà avec le même email :
- Supabase peut soit créer un nouveau compte, soit lier les comptes selon votre configuration
- Par défaut, Supabase crée un nouveau compte même si l'email existe déjà

Pour lier les comptes (recommandé) :
1. Dans Supabase Dashboard > Authentication > Settings
2. Activez **"Enable email confirmations"** si nécessaire
3. Configurez la gestion des comptes multiples selon vos besoins

### Données utilisateur

Les données récupérées depuis Google sont stockées dans :
- `auth.users.raw_user_meta_data` : Toutes les métadonnées Google
- `auth.users.user_metadata` : Métadonnées formatées
- `profiles` : Données synchronisées via le trigger

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URL de redirection dans Google Cloud Console correspond exactement à celle de Supabase
- L'URL doit être : `https://[PROJET-ID].supabase.co/auth/v1/callback`

### L'utilisateur n'est pas créé dans profiles

- Vérifiez que le trigger `on_auth_user_created` existe dans votre base de données
- Exécutez le script `supabase/create_profile_trigger.sql` si nécessaire

### Erreur de connexion réseau

- Vérifiez que votre application peut accéder à Supabase
- Vérifiez les CORS dans Supabase Dashboard > Settings > API

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Guide Supabase OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)

