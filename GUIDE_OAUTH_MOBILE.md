# Guide : Configuration OAuth pour Mobile (Google et Apple)

## 🔍 Problème

L'authentification Google/Apple fonctionne sur ordinateur mais pas sur téléphone (navigateur mobile).

## 🎯 Cause Principale

Les URLs autorisées dans Google Cloud Console et Apple Developer Portal doivent inclure votre domaine de production ET fonctionner correctement sur mobile.

## 🔧 Solution : Configuration pour Mobile

### Pour Google OAuth

#### 1. Vérifier/Corriger dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID** (type "Web application")
5. Vérifiez/modifiez les **Authorized JavaScript origins** :
   ```
   https://ollync.app
   http://localhost:5173
   http://localhost:3000
   ```
   ⚠️ **Important** : Assurez-vous que `https://ollync.app` est présent (SANS `www.`)

6. Vérifiez que les **Authorized redirect URIs** contiennent :
   ```
   https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback
   ```
   ⚠️ **Important** : Cette URL Supabase doit être EXACTEMENT celle-ci (sans slash à la fin)

7. Cliquez sur **Save**

#### 2. Vérifier dans Supabase Dashboard

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers** > **Google**
4. Vérifiez que :
   - Le toggle **Enable Google provider** est activé
   - Le **Client ID** et **Client Secret** sont corrects
5. Allez dans **Authentication** > **URL Configuration**
6. Vérifiez que **Site URL** est : `https://ollync.app`
7. Vérifiez que **Redirect URLs** contient : `https://ollync.app/**`

### Pour Apple OAuth

#### 1. Vérifier dans Apple Developer Portal

1. Allez sur [Apple Developer Portal](https://developer.apple.com/)
2. Allez dans **Certificates, Identifiers & Profiles** > **Identifiers**
3. Sélectionnez votre **Services ID** (celui configuré pour Sign in with Apple)
4. Cliquez sur **Configure** à côté de "Sign in with Apple"
5. Vérifiez les **Website URLs** :
   - **Domains and Subdomains** doit contenir : `ollync.app`
   - **Return URLs** doit contenir : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
6. Cliquez sur **Save**

#### 2. Vérifier dans Supabase Dashboard

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers** > **Apple**
4. Vérifiez que :
   - Le toggle **Enable Apple provider** est activé
   - Tous les identifiants sont corrects

## 🧪 Tests sur Mobile

### Test 1 : Vérifier l'URL

1. Ouvrez votre navigateur mobile (Safari sur iOS, Chrome sur Android)
2. Allez sur `https://ollync.app`
3. Vérifiez que l'URL dans la barre d'adresse est exactement `https://ollync.app` (pas `www.ollync.app`)

### Test 2 : Tester Google OAuth

1. Allez sur `https://ollync.app/auth/login`
2. Cliquez sur "Se connecter avec Google"
3. **Sur mobile** : La popup Google peut s'ouvrir dans un nouvel onglet
4. Après connexion, vous devriez être redirigé vers `https://ollync.app/home`

### Test 3 : Vérifier les erreurs

1. Ouvrez les outils de développement du navigateur mobile :
   - **iOS Safari** : Activer "Web Inspector" dans Réglages > Safari > Avancé
   - **Android Chrome** : Connecter via USB et utiliser Chrome DevTools
2. Regardez la console pour les erreurs
3. Vérifiez les erreurs réseau dans l'onglet Network

## 🔍 Problèmes Courants et Solutions

### Problème 1 : "redirect_uri_mismatch"

**Cause** : L'URL de redirection ne correspond pas exactement à celle configurée.

**Solution** :
- Vérifiez que l'URL dans Google Cloud Console/Apple Developer est EXACTEMENT : `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
- Pas de slash à la fin, pas d'espace, exactement comme indiqué

### Problème 2 : La popup est bloquée

**Cause** : Les navigateurs mobiles bloquent souvent les popups OAuth.

**Solution** :
- Sur mobile, OAuth devrait utiliser une redirection complète (pas une popup)
- Le code actuel utilise `signInWithOAuth` qui fait une redirection complète, c'est correct

### Problème 3 : Le callback ne fonctionne pas

**Cause** : Le callback OAuth n'est pas correctement géré après redirection.

**Solution** :
- Vérifiez que `Home.tsx` gère correctement les callbacks OAuth
- Vérifiez que l'URL après connexion contient `#access_token` ou `?code=`

### Problème 4 : La session ne persiste pas

**Cause** : Les cookies/localStorage ne fonctionnent pas correctement sur mobile.

**Solution** :
- Vérifiez que votre site utilise HTTPS (requis pour les cookies sécurisés)
- Vérifiez que `persistSession: true` est configuré dans `supabaseClient.ts`

## 📱 Configuration Spécifique Mobile

### Pour une App Native (React Native/Expo)

Si vous développez une **app native** (pas une web app dans un navigateur), vous devez :

1. **Créer un OAuth Client ID de type "iOS" ou "Android"** dans Google Cloud Console
2. **Configurer les URLs de schéma personnalisées** pour les deep links
3. **Utiliser `expo-auth-session` ou `@react-native-google-signin`** au lieu de `signInWithOAuth`

⚠️ **Note** : Le code actuel utilise `signInWithOAuth` qui est pour les **web apps**, pas pour les apps natives.

### Pour une Web App dans un Navigateur Mobile

Si vous accédez à `https://ollync.app` depuis un **navigateur mobile** (Safari, Chrome), la configuration "Web application" est correcte. Suivez les étapes ci-dessus.

## ✅ Checklist de Vérification

- [ ] Google Cloud Console : URLs autorisées incluent `https://ollync.app`
- [ ] Google Cloud Console : Redirect URI est `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
- [ ] Supabase : Site URL est `https://ollync.app`
- [ ] Supabase : Redirect URLs incluent `https://ollync.app/**`
- [ ] Apple Developer : Domaine `ollync.app` est configuré
- [ ] Apple Developer : Return URL est `https://abmtxvyycslskmnmlniq.supabase.co/auth/v1/callback`
- [ ] Test sur mobile : L'URL est exactement `https://ollync.app` (pas www)
- [ ] Test sur mobile : OAuth redirige correctement après connexion

## 🆘 Dépannage Avancé

Si les problèmes persistent après avoir suivi ce guide :

1. **Videz le cache du navigateur mobile**
2. **Testez en navigation privée** pour éliminer les problèmes de cache
3. **Vérifiez les logs Supabase** : Dashboard > Logs > Auth
4. **Vérifiez les logs Google Cloud** : Console > APIs & Services > OAuth consent screen > View logs
5. **Testez avec un autre navigateur mobile** (Safari vs Chrome)

## 📞 Support

Si vous avez toujours des problèmes, fournissez :
- Le message d'erreur exact
- La console du navigateur mobile (erreurs JavaScript)
- Les logs Supabase (Dashboard > Logs)
- Le type de téléphone et navigateur utilisé
